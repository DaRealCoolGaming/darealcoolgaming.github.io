# Checklist

Code the text based adventure •

2-3 endings •

background music •

battle music •

## game specific:

Explain the background for oot and mm X (Assume knowledge)

explain why link is where he is •

the story will be based off the indigo romhack •

## timeline

Exit house •

Pick up sticks •

Enter cave •

Exit cave •

Enter kokiri house 2 (3 houses total including shop) •

Talk to Falo •

Exit kokiri house 2 •

enter forest •

enter crypt •

option 1: kill the kokiri warrior and take the sword (bad ending start) •

option 2: spare the kokiri warrior and take the sword (good ending start) •

exit crypt •

exit forest •

enter mini forest •

enter ancient deku tree •

find roc's feather •

defeat ancient ghoma •

exit the ancient deku tree •

exit mini forest •

enter kokiri house 2 •

talk to Falo •

obtain forest's blessing X (Information makes more sense)

Fini •

## Bad Ending

talk to Falo • 

Unable To Obtain Forest's blessing X (Refusal of information makes more sense)

Lose *

# Flowchart

```mermaid
flowchart TD;
    A[House] -->|Pick Up Sticks| B(Cave)
    B --> C(Exit Cave)
    C --> D{Kokiri Village}
    D --> E[Kokiri House 1]
    D --> F[Kokiri House 3]
    D --> G[Kokiri House 2]
    D --> I(Forest)
    D --> M(Mini Forest)
    G --> H(Talk To Falo)
    I --> J{Crypt}
    J --> K[Good Ending Start]
    J --> L[Bad Ending Start]
    M --> N(Ancient Deku Tree) 
    N --> |Find Roc's Feather| O(Boss Room)
    O --> P(Defeat Ghoma)
    P --> G
    G --> Z(Finish)
    K --> I
    L --> I
```