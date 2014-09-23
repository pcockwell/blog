---
layout: post
title: Bash Alias, Export and Functions 
tags: unix, alias, efficiency
---

It's been a while since I've posted. Partially been busy, partially been lazy, and also partially been having trouble finding a topic to write about. But that's in the past now. Today's topic of discussion Bash tools to help improve effciency. Specifically, I'll discuss `alias`, `export` and Bash functions. I'll go over what they are, why you should use them, and provide some examples of what I use them for.

First, up is the `alias` command

[Wikipedia](http://en.wikipedia.org/wiki/Alias_(command)) defines Alias as a command

> which enables a replacement of a word by another string. It is mainly used for abbreviating a system command, or for adding default arguments to a regularly used command.

This is a fairly good description of what it does. Essentially, it provides shortcuts so that you can navigate your system and do common tasks with increased efficiency. In general you want to be using them to reduce the number of characters you have to type to execute a command that you use often. A very common example of this is using an alias to set command options with `ls`. Most people people prefer to use the long listing format and to show even hidden files, which requires adding `-la` as command options. That's an increase of 200% in the amount of typing (2 characters to 6 characters) if you also include the required space. By using aliases, we can shorten that so that by simply typing `ls` we will always get the long listing format and display hidden files:

```sh
alias ls='ls -la'
```

Second is the `export` command

The `export` command is used to persist Bash variables accross sessions. Using it in combination with your Bash profile (usually `.bash_profile` or `.bashrc`) can save these variables for future use. In general, I would recommend using `alias` for common commands since it doesn't really help to have a command saved in a variable. Personally, I use it to save the location of some common folders I use. Then I combine it with `alias` so that I have quick shortcuts to those locations. For example, you could do the following:

```sh
export HOME=/Users/pcockwell
export PROJ=$HOME/projects
export BLOG=$PROJ/blog

alias proj="cd $PROJ"
alias blog="cd $BLOG"
```

Combining both together allows me to base several aliased commands (or variables) off of the same base variable and if I ever need to change something, I only need to do it in one location instead of multiple.

The other thing that export is sometimes used for is terminal settings. For example, I prefer to have colors when I use the `ls` command, and I've modified my `PS1` (terminal prompt). To do that, I've set the following export commands in my Bash profile:

```sh
export PS1='[\[\e[1;31m\]\w\[\e[1;36m\]$(parse_git_branch)\[\e[0m\]]$ '
export LSCOLORS=gxBxhxDxfxhxhxhxhxcxcx
```

Let's break down that `PS1` export. 

* `[` - Simply an open bracket
* `\[\e[1;31m\]` - This is a bash representation of colour. In this case the colour is a bold red
* `\w` - This tells the prompt interpreter to output the current working directory. 
* `\[\e[1;36m\]` - A colour representation of bold cyan
* `$(parse_git_branch)` - The interpreter parses this by executing whatever is in the brackets - which in this case is a `parse_git_branch` command - and appending the result of that command to the prompt. 
* `\[\e[0m\]` - A final colour representation which brings us back to white, and then a closing bracket and a dollar sign. 

Overall, it looks a little like this:

![PS1](/blog/images/prompt.png)

For a full list of `PS1` colours that you can use, see [here](https://wiki.archlinux.org/index.php/Color_Bash_Prompt#List_of_colors_for_prompt_and_Bash).

But wait a second... What about that `parse_git_branch` command? Where did that come from, and how does it know what to output? Well, that's the final topic of discussion for today - Bash functions.

Bash functions are commands you can create that can do as many different things as you want them to (assuming you know how to do those things in bash to begin with). Essentially, think of them as functions in the sense of any other programming language, except that the functionality for these is based on normal Bash commands (or `aliases` and `exports`) and there aren't any named variables that you can pass in (though positional arguments do exist). Let's take a look at that `parse_git_branch` function from above.

```sh
parse_git_branch() {
    git branch --no-color 2> /dev/null | sed -e '/^[^*]/d' -e 's/* \(.*\)/\ →\ \1/'
}
```

* `parse_git_branch()` - Function name declaration (just like in any other language)
* `{` - This indicates the start of the actual code for the function
* `git branch --no-color` - This runs the command as if you had done that yourself on terminal. It outputs your current branch to terminal and removes the colour from the output (so that if you decide not to colour your `PS1` it won't look odd).
* `2> /dev/null` - This just tells the interpreter to discard any errors that it may encounter. Usually, these errors are the ones you get if you try and run `git branch` while not being in a git repository.
* `sed -e '/^[^*]/d'` - This deletes any lines that do not begin with `*`, and the current branch is always indicated with a leading `*`, so it isolates the branch we are currently on.
* `-e 's/* \(.*\)/\ →\ \1/'` - This matches anything beginning with&nbsp;<code>* </code>&nbsp;(note the trailing space) and saves the rest of the text in a variable. It then substitues the string for&nbsp;<code> → </code>&nbsp;(again note the spaces) and then the text that was saved in the variable (which is represented by `\1`).

In this case, the Bash function is all on one line, but this doesn't have to be the case. I use git quite a bit, and I (and my company) have many repositories. This leads to lots of repository cloning. Here's a function I wrote so that I can easily clone a repository knowing only its name.

```sh
clone(){
    if [ -n "$1" ]; then
        proj
        git clone git@github.com:pcockwell/$1.git
        cd -
    fi
}
```

This function first checks to see that a positional parameter was used and that the length of it is non-zero. It then executes an alias I have set up (shown above) to move to my projects directory, where it executes a `git clone` command knowing to clone from my personal Github account and substitutes the parameter passed in as the name of the repository. Lastly, it brings me back to wherever I was before I executed the command (using `cd -`) so I can continue with what I was doing.

With all these tools I have set up in my `.bash_profile`, I can clone a repository into a predefined folder that I can change the location of at any time and reach with a simple 4 letter command. I would wager that the I would be spending 10% of my time everyday simply writing out these full commands if I didn't have these aliases and variables and functions available to me. Now I can focus on actually getting what I need done as opposed to spending my time navigating my own system and doing repetitive tasks.