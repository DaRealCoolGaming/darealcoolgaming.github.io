
# Encryption Activity Reflection


## Part 1: Key Exchange

My Key:My number is 4
My Partner's Key:Hello - My number is 4

Our initial shared key:8

## Part 2: Messaging

Complete this table with each of your messages. This should 
include the entire conversation - the messages that you sent
and the messages that you received.

(If you used something other than the caesar cipher here, describe what you did)

| Encoded Message | Decoded Message | Key |
| --------------- | --------------- | --- |
|Q tqsm uisqvo ucaqk|I like making music|   8 |
|N qnpj qnxyjsnsl yt rzxnh|I like listening to music|  21 |
|Alex kirviw?     |What genres?|  22 |
|mzvg xjjg bvhdib hpndx|real cool gaming music|  18 |


## Part 3: Connection to TCP/IP Model

### Application Layer: Turn your message into binary

Everything we've done in this activity takes place in the application layer. By the time the message leaves the application
layer, it is encoded in binary. We've been working with text for this activity for convenience, but let's see what the binary
looks like.

Go back to the first encrypted message that you sent (it should be in `rsa_encryption_activity/send/encrypted_message.b64`).

This message is represented as a string of letters, numbers, and symbols. But we know that the real message is in binary.

Select the first six characters from this message and copy them here:

Using the ASCII table, convert these five characters to binary (if necessary,
include leading zeroes so that each character is 8 bits): 

### Transport Layer: Break your message into packets

Assume that each packet can hold two bytes. Fill in the packet information below with the binary values you computed above.

    =========
    Packet 1:

    Source: [Adrian]
    Destination: [Chris]  
    Sequence: 1/3
    Data: 01000001 00111000
    =========
    Packet 2:

    Source: [Adrian]
    Destination: [Chris]
    Sequence: 2/3 
    Data: 01100100 01010000
    =========
    Packet 3:

    Source: [Adrian]
    Destination: [Chris]
    Sequence: 3/3
    Data: 00110101 01010100 
    =========

## Part 4: Reflection Questions

- What is the difference between symmetric and asymmetric encryption? What purpose did each serve in this simulation?

Symmetric is less secure than asymmetric and asymmetric uses 2 keys. Symmetric let us communicate quicker while asymmetric made us more secure. 

- Why is it important that this protocol uses a new key for each message?

To provide security and make it harder for hackers.

- Why is it important that you never share your secret key?

If your secret key is revealed you are vulnerable to attacks.

- In the transport layer, do these messages use TCP or UDP? Why?

Most likely TCP as TCP is usually used for messaging and email and the likes. 

- Now that you've created packets in the transport layer, give a short explanation of what happens to these packets in the internet layer and in the link layer.

They get addressed in the internet layer and sent out across the link layer.

- This protocol successfully encrypts the **content** of the message. Even though and adversary in the middle can't read the content of the message, what other information can they still see?

They could see the garbish gibberish message but have no way of decrypting it without brute force. 
