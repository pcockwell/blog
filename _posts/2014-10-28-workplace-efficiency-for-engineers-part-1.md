---
title: Workplace Efficiency for Engineers - Part 1
tags: code review, programming, efficiency, engineer
---

Workplace efficiency is no simple topic for any portion of a company. For tech companies though, efficiency for their engineers can mean very large payoffs in terms of releasing a new product sooner, fixing user facing issues, or product reliability and performance to name a few. I'm going to discuss a few inefficient pain points I've encountered so far while working in the industry, and suggest a few things I've tried that have improved efficiency somewhat. In particular, I'm going to discuss the non-coding parts of being an engineer, and how you (as an engineer or someone who works closely with one) can get that little bit extra out of your day.

First on the list is code reviews. At most tech companies these days, it's common practice to have code reviewed by another member of the team before it gets deployed to production so as to avoid as many bugs as possible reaching end users or causing havoc on the rest of the code base. In general, I agree with this practice. It's smart, and it's safe. But it can also result in many inefficiencies for the engineers involved in writing the code, and for those reviewing it.

Where I work, at Hearsay Social, we use [Github](http://www.github.com) to manage our code base (including version control), enable collaboration between our engineers, and for code reviewing and deployment processes (such as unit testing). It's a very good tool that allows us to specifically reference just changes made for a single feature (or [Pull Request](https://help.github.com/articles/using-pull-requests/), as they are called), and to go in depth into each line changed and make comments and have discussions so that we can improve the quality of our code. The issue is that it is also time consuming to review all of these changes. For us, so far the solution has been to rely specifically on members of our direct team for code reviews. This is workable, but not quite as good as it could be.

Something my team has recently (yesterday) started doing is assigning a Primary and Secondary to each of our ongoing projects (or portions of a project). In general, the Primary is the main developer/programmer for that project or feature or portion, and has the most knowledge about the surrounding code base. The Secondary is chosen to be someone who is either working closely with the same code, or someone who has a familiarity with the code base. Most of the time (for us), the Secondary won't be writing code. The main job of the Secondary is to code review any changes made by the Primary. They are the designated reviewer. This doesn't mean nobody else can review - actually we encourage and want as many people as we can get to look at and comment on the code - it just means that in the end, this person is responsible for the in depth code review, and eventual approval of the Pull Request (if the code is of good quality). Everyone on the team is the Primary for the specific piece of the code (or feature) we are currently working on, and also a Secondary on at least one other portion.

I am personally a very quick mover when I develop code. I will make a new branch for a feature (or often just an isolated part of a feature), modify the handful of files that need to be changed, and make a Pull Request for the changes within the same day. I'll make sure it works, and then try and get it out there immediately so I can then move on to the next feature (or part) and not have to worry about the old one. For me, this means I can sometimes block myself from continuing until the code has been reviewed and deployed, and that I need someone reviewing and commenting on code at least once a day, if not once every few hours.

So far, this new system has seen improvements from before where it would just be a free for all, and it was the reponsibility of the person writing the code the nag and harass someone into review the code. Even still, the system is young, and isn't quite performing at the speed I had hoped it would.

Next to address is project specifications and design. I won't pretend to understand design (end user design). I'm horrible at it, and to be honest I should probably learn a bit more about it. For now though, I am able to notice a very frustrating trend and problem (from an engineer's point of view). It's easiest to explain in a story.

Our story begins with Alice and Bob. Alice is an engineer, and Bob is a designer. They are working on a tool that will help users do some calculations, and they've agreed that the first step is to build it as a website. Here are a few concerns that Alice might have:

* What mathematical operations will the application support?
* How many numbers will we allow users to put into a calculation at once?
* Should it a be a front end application (so they don't have to reload the page for the user) or a back end application (so that the heavy calculations are run on their own servers thereby reducing the load on the user)?

Alice brings these concerns to Bob, and Bob sets out to come up with some answers for Alice. Bob asks some users and gets a consensus that users want to be able to support addition, subtraction, multiplication, and division, and that they'll only need to use 2 numbers at a time. Bob tells Alice that the users don't seem to care if the application is front end or back end, so Alice can choose whatever makes things better for her. Alice gets to work - she's decided that because she's much more familiar with back end programming languages than front end, that she'll have the app run on their own servers.

After building a prototype, she brings it to Bob and he takes a look. After using the application for a little while, he sends the following email to Alice:

```
Hi Alice,

Great work on the application. It seems to work nicely, but I do have a few requests. Turns out that we
want to be able to support as many numbers for the calculator as we can, and I don't really like how the
page has to refresh everytime I calculate something.

Oh, and also, can we support brackets and exponents? I've had a few requests from customers for that since
surveying them.

Thanks,

Bob
```

To Bob, this seems like a fairly understanding request. Adding a small amount of functionality, and getting rid of something he's found to be a little unpleasant about the application. What he doesn't realize is that to Alice this email can be summarized by:

```
Hi Alice,

Thanks for working on this, but the entire specification that I gave you has completely changed. Can you
rewrite the entire thing?

Bob
```

Based on the initial specification, Alice might have made the application so that it only works with 2 inputs, and that there is a specific set of operations that are provided, and adding brackets completely changes the logic. And for Alice, getting rid of the page refresh means rewriting everything in a new language because the language she used isn't compatible with running the application as a front end tool.

As an engineer, it often happens that the specification of the project changes midway through its development. That's the nature of being a quick moving business - you need to adapt. That being said, situations like this result in Alice spending twice as much time developing this application than needed. To Alice, it also makes Bob seem very unprepared and unreliable. Had Bob asked to change the colour of one of the buttons, Alice would have gladly done so - that's only a minute or two of work for her.

My general approach to resolving this is the following:

1. Approach the designers (or those choosing the specification) and sit down with them for a while. The goal here is to be a resource for them and answer questions while coming up with an initial base for the specification
2. Specifically mention to the designers that you (as an engineer) would very much rather avoid rewriting or rebuilding the same portion of the app
3. Give them PLENTY of time to come up with a full specification for the feature - this might be a day, or it might be 3 weeks. In the meantime, work on something else
4. Once they have a full specification (or mostly full), voice your concerns and comments about the specification. Get the details important to you, and make the final refinements
5. Specifically state that you unless there is a major change to the requirements, or a small and otherwise inconsequential change to the specification, you don't want to revise the specification and that you'll be developing according to this specification
6. When the designers approach you with specification changes (which will happen), go over the change, decide whether it is inconsequential to you, or if it requires a large change to the logic. If it is a logic change, briefly explain why it isn't feasible at this point to incorporate it. Explain to them the amount of extra time required, and how much work it will be to do. And then, unless there is absolutely no option, hold firm on not changing the specification
7. Go against step 6 occasionally (and at your own discretion) if it is reasonable to do so

This forces the designer (as well as the engineer) to be very diligent in gathering requirements, and generating appropriate specifications for a feature, and it also forces the engineer to design the implementation of the feature in a way that will accomodate as many changes to or ambiguities in the specification as possible.

Since this post is getting quite long, I'll label this as Part 1 and revisit this at another point. Hopefully I've managed to get you thinking about some inefficiencies in your daily work schedule, and hopefully these tips help a few engineers with resolving these particular pain points that I've experienced. If you have any tips or suggestions to improve efficiency, or something that you'd like me to discuss and address, please feel free to leave it in the comments.