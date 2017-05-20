# Contributing to TradeJS

TradeJS is under heavy development, and so there is no stable planning at this moment. Contribution is always more then welcome, but guarantees cannot be given.

We'd love you to contribute to our source code and to make TradeJS even better than it is
today! Here are the guidelines we'd like you to follow:

 <!-- - [Code of Conduct](#coc) -->
 <!-- - [Question or Problem?](#question) -->
 - [Issues and Bugs](#issue)
 - [Feature Requests](#feature)
 <!-- - [Submission Guidelines](#submit) -->
 - [Coding Rules](#rules)
 <!-- - [Commit Message Guidelines](#commit) -->
 <!-- - [Signing the CLA](#cla) -->
 <!-- - [Further Info](#info) -->

<!-- ## <a name="coc"></a> Code of Conduct -->

<!-- Help us keep TradeJS open and inclusive. Please read and follow our [Code of Conduct][coc]. -->

<!-- ## <a name="question"></a> Got a Question or Problem? -->

<!-- If you have questions about how to use TradeJS, please direct these to the [Google Group][groups] -->
<!-- discussion list or [StackOverflow][stackoverflow]. We are also available on [IRC][irc] and -->
<!-- [Gitter][gitter]. -->

## <a name="issue"></a> Found an Issue?

If you find a bug in the source code or a mistake in the documentation, you can help us by
submitting an issue to our [GitHub Repository][github]. Even better you can submit a Pull Request
with a fix.

**Please see the [Submission Guidelines](#submit) below.**

## <a name="feature"></a> Want a Feature?

You can request a new feature by submitting an issue to our [GitHub Repository][github].  If you
would like to implement a new feature then consider what kind of change it is:

* **Major Changes** that you wish to contribute to the project should be discussed first so that we can better coordinate our efforts,
  prevent duplication of work, and help you to craft the change so that it is successfully accepted
  into the project.
* **Small Changes** can be crafted and submitted to the [GitHub Repository][github] as a Pull
  Request.


## <a name="docs"></a> Want a Doc Fix?

If you want to help improve the docs, it's a good idea to let others know what you're working on to
minimize duplication of effort. Create a new issue (or comment on a related existing one) to let
others know what you're working on.

For large fixes, please build and test the documentation before submitting the PR to be sure you
haven't accidentally introduced any layout or formatting issues. You should also make sure that your
commit message starts with "docs" and follows the **[Commit Message Guidelines](#commit)** outlined
below.

If you're just making a small change, don't worry about filing an issue first. Use the friendly blue
"Improve this doc" button at the top right of the doc page to fork the repository in-place and make
a quick change on the fly. When naming the commit, it is advised to follow the commit message
guidelines below, by starting the commit message with **docs** and referencing the filename. Since
this is not obvious and some changes are made on the fly, this is not strictly necessary and we will
understand if this isn't done the first few times.

### Submitting a Pull Request
Before you submit your pull request consider the following guidelines:

* Search [GitHub](https://github.com/DutchKevv/TradeJS/pulls) for an open or closed Pull Request
  that relates to your submission. You don't want to duplicate effort.

### Code styling

TODO. For now please take a look around in the code, its pretty default.

### Starting Dev mode

 Make sure you have a **practise** account on Oanda (https://www.oanda.com/).
  
  ```
     
     # terminal 1
     cd [PATH_TO_TRADEJS]/client
     npm i (required once)
     npm start
     
     # terminal 2
     cd [PATH_TO_TRADEJS]/server
     npm i (required once)
     npm start
     
     ### For desktop app electron ->
     # terminal 3
     cd [PATH_TO_TRADEJS]/electron
     npm i (required once)
     npm run start
    
 ```
 
 * Optional - Not needed when using electron. Go to http://localhost:4200 in Chrome
 * Click on login and fill in Oanda credentials
 * Probably a few refreshes/reboots is still required (will be smoothed out in the future)
