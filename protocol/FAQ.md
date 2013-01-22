What is it about tokens, blinds, payloads, blanks, coins?
---------------------------------------------------------
In explaining opencoin in non-technical terms we say: "you put a blank 
in an envelope, stamp through the envelope (blind signature), open
the envelope (unblind) and you get the coin". 
As nice as the metapher is, it doesn't quite work when defining the 
protocol. As we have a data container that is never changed (unlike
the blank, which gets transformed by minting), and that data container
only gets combined with a signature into a coin, we used the term 
payload instead. Blank might give the impression that its a container 
that gets modfied in someway, but no modification takes place.

So, a Payload without signature is equal to a Blank, a Blind contains 
the blinded hash of the Payload, a Blind Signature object holds the 
blind signature, and a Coin consists of a Payload, and a Signature 
(which is the unblinded blind signature of the Payload).


There are optional fields on some of the messages.
--------------------------------------------------
The alternative would be to have more different messages. As we work
with a challenge response protocol, we wanted it to be clear what 
response object to expect for a message. Its a question of the right 
mixture of amount of messages, and number of optional fields.


Having field xyz in the protocol would be useful. Why isn't it there?
---------------------------------------------------------------------

We try to create the protocol with as few fields as possible, but as
many as necessary. Its tempting to add a field here and there, but
then we suddenly have information/data bloat. So the idea is to keep
it simple, and try to find out whats needed (instead of nice).


(Implementation) Why is the id in the DSDB not just the serial
--------------------------------------------------------------

An attacker could otherwise block arbitary serial numbers. Its an 
expensive attacks (the serials have to be signed to get into the 
DSDB), but we rather prevent this.

