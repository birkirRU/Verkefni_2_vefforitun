let synth = new Tone.Synth({
    oscillator: {
        type: "sine" 
    }
}).toDestination();

const NOTES = {
    red: "C4",
    yellow: "D4",
    green: "E4",
    blue: "F4"
};

const playTuneForColor = (color, delay) => {
    const now = Tone.now();
    synth.triggerAttackRelease(NOTES[color], "6n", now + delay);
};

const playToneFromColor = (color, delay) => {
    if (NOTES.hasOwnProperty(color)) {
        return playTuneForColor(color, delay);
    }
};

const holdPad = (event) => {
    if (document.getElementById("start-btn").disabled === false) {
        return;
    }
    const current_pad = getPadFromUserInput(event)[1];
    if (!current_pad.hasAttribute("active")) {
        current_pad.classList.add("active");
    } 

}

const getPadFromUserInput = (event) => {
    if (event.type === "keyup" || event.type === "keydown") {
        if (["q", "w", "a", "s"].includes(event.key)) {
            const id = {"q": "pad-red", "w": "pad-yellow", "a": "pad-green", "s": "pad-blue"}[event.key]
            return [id.split("-")[1], document.getElementById(id)];
        }
    }
    else if (event.type === "click" || event.type === "mousedown") {
        return [event.target.id.split("-")[1], document.getElementById(event.target.id)];
    }
}


const logPadClick = (event) => {
    if (document.getElementById("start-btn").disabled === false) {
        return;
    }
    const [color, pad] = getPadFromUserInput(event);

    user_input.sequence.push(color);
    
    playToneFromColor(color, delay=0);
    pad.classList.remove("active");

    checkSequence();

}

const startGame = () => {
    playSequence(server_data.sequence);
    startButton.disabled = !startButton.disabled;
    replayButton.disabled = !replayButton.disabled;

}

const checkSequence = async () => {
    if (user_input.sequence.length === current_level) {
        
        const response = await validateSequence(user_input);
        
        if (response.status >= 200 && response.status < 300) {
            high_score_element.innerHTML = response.data.gameState.highScore;
            setTimeout(() => playSequence(server_data.sequence), 1250);
        }
        
        else if (response.status >= 400) {
            displayFailureModal();
        }
        
        user_input.sequence = [];
        server_data.sequence = response.data.gameState.sequence;
        current_level = response.data.gameState.level;
        document.getElementById("level-indicator").innerHTML = current_level;
    }
}

const displayFailureModal = () => {
    modal.style.display = "block";
}

const resetGame = () => {
    modal.style.display = "none";
    initializeGame();
    startButton.disabled = !startButton.disabled;
    replayButton.disabled = !replayButton.disabled;
}

const playSequence = (sequence) => {
    let delay = 0;
    sequence.forEach((color) => {
        const current_pad = document.getElementById(`pad-${color}`)
        const play_delay = 1000 
        const remove_delay = 900
        setTimeout( () => current_pad.classList.add("active"), play_delay*delay);
        playToneFromColor(color, delay);
        delay += 0.5;
        setTimeout( () => current_pad.classList.remove("active"), remove_delay*delay);
    }) 
};



let user_input = {sequence: []};
let current_level = 0;
let server_data = {sequence: []};


const pads = document.getElementsByClassName("pad");
const padsArray = Array.from(pads);

padsArray.forEach((pad) => {
    document.body.addEventListener("keyup", logPadClick);
    pad.addEventListener("click", logPadClick);
    document.body.addEventListener("keydown", holdPad);
    pad.addEventListener("mousedown", holdPad);
});

let high_score_element = document.getElementById("high-score");

const initialGameState = async () => {
    let game = await initializeGame();
    high_score_element.innerHTML = game.data.gameState.highScore;

    current_level = game.data.gameState.level;
    document.getElementById("level-indicator").innerHTML = current_level;
    server_data.sequence = game.data.gameState.sequence;

    synth.oscillator.type = "sine";
    document.getElementById("sound-select").value = "sine";
    
    startButton.disabled = false;
    replayButton.disabled = true;

}

const startButton = document.getElementById("start-btn");
startButton.addEventListener("click", () => startGame());

const replayButton = document.getElementById("replay-btn");
replayButton.addEventListener("click", () => playSequence(server_data.sequence));

const modal = document.getElementById("failure-modal");

const resetButton = document.getElementById("reset-btn");
resetButton.addEventListener("click", () => resetGame());


const soundSelect = document.getElementById("sound-select");
soundSelect.addEventListener("change", (event) => {
    synth.oscillator.type = String(event.target.value).toLowerCase();
})


const initializeGame = async () => {
    const url = "http://localhost:3000/api/v1/game-state";

    try {
        const response = await axios.put(url);
        server_data.sequence = response.data.gameState.sequence;
        current_level = response.data.gameState.level;
        document.getElementById("level-indicator").innerHTML = current_level;
        return {status: response.status, data: response.data};
    }
    catch (error) {
        
        return {status: error.response.status, data: error.response.data};
    }    
}


const validateSequence = async (sequence_object) => {

    const url = "http://localhost:3000/api/v1/game-state/sequence";
    try {
        const response = await axios.post(url, sequence_object)
        return {status: response.status, data: response.data};
    }
    catch (error) {
        return {status: error.response.status, data: error.response.data};
    }
}

window.addEventListener("load", () => {
    initialGameState();
});