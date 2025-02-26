
let synth = new Tone.Synth({
    oscillator: {
        type: "sine" 
    }
}).toDestination();

const playTuneRed = (delay) => {
    const now = Tone.now();
    synth.triggerAttackRelease("C4", "6n", now + delay);
};

const playTuneYellow = (delay) => {
    const now = Tone.now();
    synth.triggerAttackRelease("D4", "6n", now + delay);
};

const playTuneGreen = (delay) => {
    const now = Tone.now();
    synth.triggerAttackRelease("E4", "6n", now + delay);
};
const playTuneBlue = (delay) => {
    const now = Tone.now();
    synth.triggerAttackRelease("F4", "6n", now + delay);
};


const playToneFromColor = (color, delay) => {
    if (color === "red") {
        return playTuneRed(delay);
    } else if (color === "yellow") {
        return playTuneYellow(delay);
    } else if (color === "green") {
        return playTuneGreen(delay);
    } else if (color === "blue") {
        return playTuneBlue(delay);
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

    console.log(pad)

    user_input.sequence.push(color);
    
    playToneFromColor(color, delay=0);
    pad.classList.remove("active");

    checkSequence();

}

const startGame = () => {
    playSequence(server_data.sequence);
    startButton.disabled = !startButton.disabled;
    replayButton.disabled = !replayButton.disabled;
    console.log(server_data.sequence);

}

const checkSequence = async () => {
    console.log(user_input.sequence.length, current_level);
    if (user_input.sequence.length === current_level) {
        
        const response = await validateSequence(user_input);
        
        if (response.status === 200) {
            high_score_element.innerHTML = response.data.gameState.highScore;
            setTimeout(() => playSequence(server_data.sequence), 1250);
        }
        
        else if (response.status === 400) {
            displayFailureModal();
        }
        
        user_input.sequence = [];
        server_data.sequence = response.data.gameState.sequence;
        current_level = response.data.gameState.level;
        document.getElementById("level-indicator").innerHTML = current_level;
        console.log(server_data.sequence);
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
        setTimeout( () => current_pad.classList.add("active"), 1000*delay);
        playToneFromColor(color, delay);
        delay += 0.5;
        setTimeout( () => current_pad.classList.remove("active"), 900*delay);
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


    //Perform a PUT request to the url
    try {
        const response = await axios.put(url);
        //When successful, print the received data
        console.log("Success: ", response.data);

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
        console.log(error);
        return {status: error.response.status, data: error.response.data};
    }
}

window.addEventListener("load", () => {
    initialGameState();
});