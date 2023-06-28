# Tic Tac Toe

## Menu

### Main menu

Title (Tic Tac Toe)  
Start Game:  
Solo (AI) [Difficulty screen]  
Solo (Coop)

### Difficulty screen

Impossible - 95%  
Hard - 75%  
Medium - 55%  
Easy- 30%

---

## Scheme

Field - Matrix [3x3]  
Cell state:  
 0 - Empty  
 1 - X  
 2 - O

---

## Algorithm

Loop:

1. Clear grid
2. Check for winner
   1. Show winning screen
   2. Back to 1
3. Check whos turn is now
   1. Player X makes turn
      1. Check for valid placement
   2. Player O makes turn
      1. Check for valid placement
4. Back to 1

---

## AI Difficulty

### Logic

1. Win
2. Block the player
3. Center
4. Block Corner Abuse
5. Block Г Abuse
6. Corner (if applicable) (if not diagonal)
7. Side (if applicable)
8. Any free cell

```C
[1][2][ ]
[ ][ ][4]
[3][ ][ ]
```

## Multiplayer

### Protocol

Structure - "command(:args)*"
send - "->"
receive - "<-"

1. <-> Connect
2. -> "host" or "join:%token%"

### Host

1. <- "hosted:%token%"
2. <-> Game data

### Client

1. <- "joined"
2. <-> Game data

### Game data

All not server related commands must start with "msg:"

Start: -> "msg:start:%gridX%:%gridY%:%winLine%:0|1" -- 1 - you should make a turn
Make turn: -> "msg:turn:%x%:%y%"
Game ended: -> "msg:end:win|lose|draw"
Exit room: -> "exit"
Vote for restart: -> "msg:vote_restart"
Room restarted: -> "msg:restart"

### Decline

Command: "decline:%reason%"

Reasons:
"banned"
"room already exists"
"room id is invalid"
"room is full"
"not your turn"
"invalid coords"
"unexpected turn"

## Dynamic Menu

.menu [.overlay] [.backdrop] {switches pages, can have overlay and backdrop}
   .page [.active] {contains options}
      .slider [.disable] {contains index, can be min-max disabled}
         span [.bloked]
         span.selected [.bloked]
         ...
      .inline [.centered] [.disable] {contains array of values}
         input [.fail]
         div [.button]
         ...
      .text [.title] [.loading] [.error]
         text
   .page
      .option
   .page
      .option
      .option

## TODO

- hide / block unused settings ✅
- ready checkboxes
- opponent left window
- error notification

- crosswin animation
- place turn animation
- falling list for choosing:
  - turn skins
  - win skins
  - board skins
  - background animated skins
  - main menu skins
  - chibba skins
- unique rules for different skins
- different gamemods
- sound for boards
- sound for chibbis
- sound for turns
- sound for wins
- interaction with boards
- interaction with chibbis

opponent wants rematch => opponent is ready
opponent must agree to restart => waiting for opponent
