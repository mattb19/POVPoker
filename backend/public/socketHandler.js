window.onload = function() {
    const fragment = window.location.hash.substring(1); // Get the part after #
    if (fragment) {
        // Redirect to the same path with gameId as a query parameter
        window.location.href = `/poker?gameId=${fragment}`;
    }
}

function showBetSlider() {
    const slider = document.querySelector('.custom-slider-container');
    const cbets = document.querySelector('.customBetContainer');
    slider.style.animation = 'sliderfade 0.5s forwards'
    cbets.style.animation = 'customFade 0.5s forwards'
}

function moveBetVal() {
    const button = document.querySelector('.slider-value-button');
    const slider = document.querySelector('.custom-slider-container');
    button.textContent = slider.value; // Set button text to slider value
}

///////////////////// Handle web socket Dynamic Updating /////////////////////
const socket = io();
const urlParams = new URLSearchParams(window.location.search);
const gameId = urlParams.get('gameId');
const username = window.uname;

socket.emit('joinGame', gameId, username);

socket.on('redirect', (data) => {
    // Check if data.path is defined
    if (data && data.url) {
        const baseUrl = window.location.origin; // Get the base URL
        window.location.href = baseUrl + data.url; // Redirect to the new page
    } else {
        console.error('Redirect path is undefined:', data);
    }
});

// Listen for updates to pot and current bet
socket.on('updateInfo', (game) => {
    const username = window.uname;

    if (typeof game === 'string') {
        // Replace single quotes with double quotes
        game = game.replace(/'/g, '"');

        // Replace True and False with true and false
        game = game.replace(/\bTrue\b/g, 'true');
        game = game.replace(/\bFalse\b/g, 'false');
        
        try {
            game = JSON.parse(game); // Attempt to parse
        } catch (error) {
            console.error('Error parsing game JSON:', error);
            console.error('Invalid JSON string:', game); 
            return; 
        }
    }

    console.log('Received game object: ', game);

    const potElement = document.getElementById('potAmount');
    const currentBetElement = document.getElementById('currentBetAmount');

    potElement.innerText = game.pot;
    currentBetElement.innerText = `Current Bet: ${game.currentBet}`;

    userButtons = document.getElementById('mainButtonContainer');
    let currentPlayerName;
    if (game.currentPlayer !== null) {
        currentPlayerName = game.players[game.currentPlayer].user;
    }

    // Hide all player slots and profilePicActive divs
    const totalPlayers = game.players.length;
    const nameList = game.players.map(player => player.user);
    const userIndex = nameList.indexOf(username);
    let rotatePlayers;
    if (userIndex === -1) {
        const temp = 1;
        // Here we will handle what happens if a spectator joins
    } else {
        rotatePlayers = game.players.slice(userIndex).concat(game.players.slice(0, userIndex));
    }
    const newNameList = rotatePlayers.map(player => player.user);
    const currentPlayer = newNameList.indexOf(currentPlayerName);
    const userPlayer = rotatePlayers[newNameList.indexOf(username)];

    // Making users cards visible
    const card1Element = document.getElementById('userCard1');
    const card2Element = document.getElementById('userCard2');
    const card1 = userPlayer.card1;
    const card2 = userPlayer.card2;
    const card1SRC = `images/poker cards/${card1._num}_of_${card1._suit.toLowerCase()}.png`;
    const card2SRC = `images/poker cards/${card2._num}_of_${card2._suit.toLowerCase()}.png`;
    card1Element.src = card1SRC;
    card2Element.src = card2SRC;

    // Changing check/call button as needed for user
    if (game.currentBet == userPlayer.currentBet) {
        document.getElementById('checkCall').innerText = 'CHECK';
    }
    else if (game.currentBet > userPlayer.currentBet) {
        document.getElementById('checkCall').innerText = 'CALL';
    }

    // Setting active marker on betting buttons if its users turn
    betButtonElement = document.getElementById('player00');
    if (currentPlayer == newNameList.indexOf(username)) {
        betButtonElement.style.backgroundColor = "rgba(0, 175, 0, 1)";
        betButtonElement.style.animation = "expandButtons 2s infinite";
    } else {
        betButtonElement.style.backgroundColor = "rgba(0, 0, 0, 1)";
        betButtonElement.style.animation = "None";
    }

    if (userPlayer.currentBet === null) {
        card1Element.style.animation = "out 0.5s forwards";
        card2Element.style.animation = "out 0.5s forwards";
    } else {
        card1Element.style.animation = "";
        card2Element.style.animation = "";
    }

    // Setting bet slider max to users chip count
    const userChipCount = userPlayer.chipCount;
    document.getElementById('rV').max = userChipCount;

    // Handling update info for all other players
    for (let i = 0; i < 9; i++) {
        const playerSlot = document.getElementById(`player${i}`);
        if (playerSlot) {
            if (i < totalPlayers) {
                // Show active players, set name and chipCount
                playerSlot.style.display = 'flex'; // or whatever display you are using
                const playerName = document.getElementById(`player${i}Name`);
                playerName.innerText = rotatePlayers[i].user;
                const playerChips = document.getElementById(`player${i}ChipCount`);
                playerChips.innerText = `${rotatePlayers[i].chipCount} chips`

                // Set each players cards
                if (game.round == 4 && rotatePlayers[i].currentBet !== null){
                    const card1Element = document.getElementById(`p${i}c1`);
                    const card2Element = document.getElementById(`p${i}c2`);
                    const card1 = rotatePlayers[i].card1;
                    const card2 = rotatePlayers[i].card2;
                    const card1SRC = `images/poker cards/${card1._num}_of_${card1._suit.toLowerCase()}.png`;
                    const card2SRC = `images/poker cards/${card2._num}_of_${card2._suit.toLowerCase()}.png`;
                    card1Element.src = card1SRC;
                    card2Element.src = card2SRC;
                }
                
                // Setting turn indicator for whoevers turn it is
                if (i === currentPlayer) {
                    playerSlot.style.backgroundColor = "rgba(0, 175, 0, 1)";
                    playerSlot.style.animation = "expandButtons 2s infinite";
                    playerSlot.style.color = "white";
                } else {
                    playerSlot.style.backgroundColor = "rgba(0, 0, 0, 1)";
                    playerSlot.style.animation = "None";
                    playerSlot.style.color = "white";
                }
                
                // Removing folded players cards and fading them out
                const card1Element = document.getElementById(`p${i}c1`);
                const card2Element = document.getElementById(`p${i}c2`);
                if (rotatePlayers[i].currentBet == null) {
                    card1Element.style.animation = "fold1 0.5s forwards ease";
                    card2Element.style.animation = "fold2 0.5s forwards ease";
                    playerSlot.style.animation = "out 0.5s forwards";
                } else {
                    playerSlot.style.opacity = "1";
                    card1Element.style.animation = "";
                    card2Element.style.animation = "";
                }

            } else {
                playerSlot.style.display = 'none'; // Hide unused player slots
            }
        }
    }

    // Setting table cards
    const flop1Element = document.getElementById('flop1');
    const flop2Element = document.getElementById('flop2');
    const flop3Element = document.getElementById('flop3');
    const turnElement = document.getElementById('turn');
    const riverElement = document.getElementById('river');
    flop1Element.src = `images/poker cards/${game.flop1._num}_of_${game.flop1._suit.toLowerCase()}.png`;
    flop2Element.src = `images/poker cards/${game.flop2._num}_of_${game.flop2._suit.toLowerCase()}.png`;
    flop3Element.src = `images/poker cards/${game.flop3._num}_of_${game.flop3._suit.toLowerCase()}.png`;
    turnElement.src = `images/poker cards/${game.turn._num}_of_${game.turn._suit.toLowerCase()}.png`;
    riverElement.src = `images/poker cards/${game.river._num}_of_${game.river._suit.toLowerCase()}.png`;


    // Changing users name to "YOU"
    document.getElementById('player0Name').innerText = 'YOU'
});

/**
 * Emit the "call" event to the server when the button is clicked. Used to be named call
 * @param {string} buttonId - The ID of the button that was clicked.
 */
function action(data) {
    const dataString = data;
    console.log(`Sending bet: ${dataString}`);
    // Emit the "action" (used to be "call") event to the server when the button is clicked
    socket.emit('action', { dataString }, { gameId });
}