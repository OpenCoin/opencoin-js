opencoin client implementation in js
====================================

These are the first steps to implement the new version of the protocol
in js.

The code is (c) 2012 Joerg Baach, License GPL v2.

Have a look at index.html to see whats going on.

So far, the code can do all protocol primitives, including client and 
server side functionality, handling of messages. It doesn't do proper 
randomness (hence the crypto is unusable), and doesn't do proper error
handling (because it still needs work, and its not spec'ed yet).


