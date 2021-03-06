---
title: IP Based Whitelisting Through An AWS Elastic Load Balancer With The Proxy Protocol
tags: proxy protocol, elb, ip whitelist
hidden: true
---

A recent push has been made at Agari to improve the availability of our
infrastructure and ensure its fault tolerance. Doing this with AWS is not a
particularly complicated task, and provides long term peace of mind as to
the resilience of our system. Agari employs the use of
[bastion hosts](http://en.wikipedia.org/wiki/Bastion_host) to provide a secure
gateway into our infrastructure from the outside.

The old setup for these machines, while strong, was not highly available. The
setup used NGINX and the `Hosts Access` files that most systems use to manage
SSH connections. In order to allow dynamic access from new IPs, we set up an
SSH-based two-factor authentication mechanism via
[authy-ssh](https://github.com/authy/authy-ssh) that updates a `hosts.allow`
file stored in S3. Our bastion hosts then use cron jobs to pull down new
versions of this file, thus allowing an IP authorized via Authy to connect to
our infrastructure. The system also goes through and removes IPs added in this
way after a fixed period.

The simplest way to make this system highly available in the case of an
individual instance outage or, in the worst case, a full availability zone
failure, was to put these bastion hosts behind an AWS Elastic Load Balancer.
Doing so would allow our routing, IP based authorization, and the additional
services running on these instances to be agnostic of specifically which of the
instances they were running on.

Setting up and configuring the ELB in front of these instances was quite simple
using [Terraform](https://www.terraform.io/) and AWS. The anonymized code below
is what we used to set things up via Terraform.

~~~
resource "aws_elb" "gate" {
  name = "gate-elb"
  subnets = ["${aws_subnet.public.*.id}"]
  security_groups = ["${aws_security_group.SECURITY_GROUP.id}"]

  listener {
    instance_port = 10022
    instance_protocol = "tcp"
    lb_port = 22
    lb_protocol = "tcp"
  }

  listener {
    instance_port = 80
    instance_protocol = "http"
    lb_port = 443
    lb_protocol = "https"
    ssl_certificate_id = "${data.aws_acm_certificate.SSL_CERTIFICATE.arn}"
  }

  health_check {
    healthy_threshold = 2
    unhealthy_threshold = 5
    timeout = 3
    target = "TCP:10022"
    interval = 30
  }

  instances = ["${aws_instance.gate.*.id}"]
  cross_zone_load_balancing = true
  idle_timeout = 3600
  connection_draining = true
  connection_draining_timeout = 3600

  tags {
    Name = "gate-elb"
    env = "${var.environment}"
    product = "cp"
    role = "gate"
  }
}

resource "aws_route53_record" "gate-elb" {
    lifecycle { create_before_destroy = true }
    zone_id = "${aws_route53_zone.primary.zone_id}"
    name = "gate.cp.${var.environment}.agari.com"
    type = "CNAME"
    ttl = "300"
    records = ["${aws_elb.gate.dns_name}"]
}

resource "aws_proxy_protocol_policy" "gate" {
    load_balancer = "${aws_elb.gate.name}"
    instance_ports = [10022]
}
~~~

Our first attempt at the IP authorization using the new ELB was to setup the
ELB to support the
[Proxy Protocol](http://www.haproxy.org/download/1.8/doc/proxy-protocol.txt),
which forwards through connection information to the underlying web server, and
then configuring NGINX to use the `ngx_stream_proxy_module` to accept and parse
requests coming in via the Proxy Protocol. Unfortunately, the functionality
required to do this is unavailable in NGINX until version `1.11.4`, which is
unsupported by current Ubuntu offerings.

As an alternative, we looked into creating our own simple TCP proxy service
to authorize and pass on requests to the `gate` bastion hosts. We began with
the code for a simple Python TCP proxy called 
[`asyncioproxy`](https://github.com/aaronriekenberg/asyncioproxy) and built
upon that. The final result was
[`tcp-authz-proxy`](https://github.com/agaridata/tcp-authz-proxy) which runs as
a service on our `gate` bastion hosts.

#### The `Hosts Access` file parsing and authentication

The
[Config](https://github.com/agaridata/tcp-authz-proxy/blob/master/lib/tcp_authz_proxy/config.py)
portion of service accepts the names of two files, which are expected to use
the `Hosts Access` [file format](https://linux.die.net/man/5/hosts.allow). The
documention on `Hosts Access` control flow also dictates how the comparative IP
authentication should be implemented. Namely, the IP of an incoming request
goes through up to three levels of checks before access is granted or denied:

1. Check the IP against `hosts.allow`, granting access in the case of a match
2. Check the IP against `hosts.deny`, denying access in the case of a match
3. Grant access to all IPs unmatched in either of the previous steps

It is important to note that there are ways to specify IP ranges or have a
blanket accept or deny rule in either of these files. Our setup for this is an
explicit whitelist in the `hosts.allow` file and a blanket `ALL: ALL` directive
in the `hosts.deny` file to subsequently deny any IP not explicitly allowed.
This is what we recommend for
the tightest security.

A `Config` object is created with the names of both of these files, which in
turn creates a `HostsFile` object for each of these. The `HostsFile` class
parses the contents of the file per the specifications, and uses the `Radix`
library to generate a data structure that represents the IP space covered by
that file. It also stores the OS value for the time that file was last modified
so that it can provide a smart refresh mechanism since we modify those files
regularly to add and remove IP addresses being authorized via `authy-ssh`. The
`Config` object uses the Python `asyncio` library to schedule an attempted
refresh of these files on a regular interval to pick up those changes.

Finally, the `Config` object also exposes a method to check if an IP is allowed
by codifying the IP authentication process above. I've included the code for
the config class below, minus the complicated portion that parses IP addresses
and adds them to the internal data store.

~~~python
class Config(object):
    def __init__(self, hosts_allow_filename, hosts_deny_filename, loop):
        self.hosts_allow = HostsFile(hosts_allow_filename)
        self.hosts_deny = HostsFile(hosts_deny_filename)
        self.loop = loop
        self.loop.call_later(HOSTS_FILE_REFRESH_INTERVAL_SECONDS, self.refresh_hosts_files)

    def refresh_hosts_files(self):
        self.hosts_allow.refresh()
        self.hosts_deny.refresh()
        self.loop.call_later(HOSTS_FILE_REFRESH_INTERVAL_SECONDS, self.refresh_hosts_files)

    def ip_allowed(self, ip):
        # Allowed if hosts_allow contains IP
        if self.hosts_allow.contains(ip):
            return True

        # Not allowed if hosts_deny contains IP
        if self.hosts_deny.contains(ip):
            return False

        # Otherwise, allowed
        return True
~~~

#### The `asyncio` servers and protocols for authorizing and forwarding request data

As of 3.4, Python offers the `asyncio` library. Per documentation, it provides
support for

> single-threaded concurrent code using coroutines, multiplexing I/O access
> over sockets and other resources, [and] running network clients and servers

Given the nature of this project, it made sense to leverage the built-in
support from `asyncio` for server protocols to handle the I/O portions of
authorizing and forwarding request data.

The
[Protocol](https://github.com/agaridata/tcp-authz-proxy/blob/master/lib/tcp_authz_proxy/protocol.py)
module contains two protocol classes and a variety of regular expression
definitions for parsing the expected incoming Proxy Protocol header. The meat
of the code is the `TCPAuthzProxyProtocol` class, which upon receiving data
will try to identify and parse the pattern for the Proxy Protocol. After doing
so, it compares the requesting IP from the header to the allowed IP list
specified by the `Config` object passed in, and if authorized, it will
subsequently open a connection to the internal endpoint that would otherwise
serve SSH requests. This connection is opened and managed via `asyncio` to
allowing multiple concurrent sessions.

The code included below is the setup code for the server that implements the
usage of the `TCPAuthzProxyProtocol` class:

~~~python
loop = asyncio.get_event_loop()

config = Config(HOSTS_ALLOW, HOSTS_DENY, loop)

server_coro = loop.create_server(
    lambda: tcp_authz_proxy.protocol.TCPAuthzProxyProtocol(config, remote_socket_host, remote_socket_port, loop),
    listen_socket_host, listen_socket_port
)
server = loop.run_until_complete(server_coro) 
logger.notice('Accepting TCP proxy requests on {0}:{1} ...'.format(*server.sockets[0].getsockname()))

try:
    loop.run_forever()
except KeyboardInterrupt:
    logger.notice('Server stopped by manual interrupt')
except BaseException as err:
    logger.error('Error caught: {}. Exiting...'.format(err))

logger.notice('Closing server')
server.close()
loop.run_until_complete(server.wait_closed())
loop.close()
~~~

First and foremost, it defines the `Config` object discussed previously, and
then uses the `asyncio` I/O server methods to open socket accepting connections
on the specified port and addresses. When a new connection is initiated, it
creates a new instance of the `TCPAuthzProxyProtocol` with the static state
values defined previously, and begins passing the received data to the protocol
to be handled on an individual basis.

In order to have the server run and continually accept incoming connections, we
then issue the command `loop.run_forever()` which tells the event loop to
continue executing necessary functions of the server until the program is
manually terminated or it runs into an error, at which point it would
gracefully shut down the server.

#### Putting it in operation

As we were working on this project, we decided it would be a good opportunity
to upgrade to Ubuntu 16.04 which uses the new `systemd` setup for services. We
use Ansible to ensure that the required `.service` file (included below) is
copied to the necessary location and then subsequently added as an operating
daemon on the instances that are servicing requests from the ELB.

~~~
[Unit]
Description=Start and stop the TCP authorizing proxy
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/agari/tcp-authz-proxy/production/current/bin/tcp-authz-proxy --syslog local7 *:10022 localhost:22
Restart=always
~~~

The contents of this file simply indicate that the service is not to be started
until after the `network.target` service (which handles socket connections) has
finished setting up and is running, as well as the command to be used to start
the service. In this case, we are indicating which `syslog` facility we want
the logs for this service to be sent to, the inbound address and port
(`*:10022`) for incoming connections, and where to forward authorized
connections to (`locahost:22`).

Thanks for reading, and hopefully you've learned a little bit about how to
authorize TCP connections coming in via an AWS ELB using a potentially dynamic
IP whitelist.