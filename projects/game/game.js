let gameActive = true;

let currentLocation = 'house';
let inventory = [];
let forestBlessing = false; 
let kokiriWarriorAlive = true; // affects good/bad ending

const MusicPlayer = (function(){
    let ToneLib = null;
    let MidiLib = null;
    let activeParts = [];

    function loadScript(url){
        return new Promise((resolve,reject)=>{
            const s = document.createElement('script');
            s.src = url;
            s.onload = () => resolve();
            s.onerror = () => reject(new Error('Failed to load ' + url));
            document.head.appendChild(s);
        });
    }

    async function ensureLibs(){
        if (!window.Tone) {
            await loadScript('https://cdn.jsdelivr.net/npm/tone@14.7.77/build/Tone.min.js');
        }
        if (!window.Midi) {
            await loadScript('https://cdn.jsdelivr.net/npm/@tonejs/midi@2.0.27/build/Midi.min.js');
        }
        ToneLib = window.Tone;
        MidiLib = window.Midi;
        try{ print('\n[Audio] Tone.js and Midi libs loaded.'); }catch(e){}
    }

    async function playMidi(filePath, options = {}){
        try{
            await ensureLibs();
            try{ print('\n[Audio] Fetching ' + filePath + ' ...'); }catch(e){}
            const resp = await fetch(encodeURI(filePath));
            if (!resp.ok) {
                try{ print('\n[Audio] Failed to fetch ' + filePath + ': ' + resp.status); }catch(e){}
                throw new Error('Fetch failed: ' + resp.status);
            }
            const ab = await resp.arrayBuffer();
            const midi = new MidiLib(ab);

            try{ print('\n[Audio] MIDI parsed. Tracks: ' + midi.tracks.length + ', duration: ' + midi.duration + 's'); }catch(e){}

            // stop mujsic
            stop();

            const now = ToneLib.now() + 0.2;
            // synth
            const synth = new ToneLib.PolySynth(ToneLib.Synth).toDestination();
            try{ synth.volume.value = 0; }catch(e){}

            midi.tracks.forEach(track => {
                if (track.notes.length === 0) return;
                const events = track.notes.map(n => ({
                    time: n.time,
                    note: n.name,
                    duration: n.duration,
                    velocity: n.velocity
                }));
                const part = new ToneLib.Part((time, value) => {
                    try{ synth.triggerAttackRelease(value.note, value.duration, time, value.velocity); }catch(e){}
                }, events).start(now);
                try{ part.loop = true; part.loopEnd = midi.duration; }catch(e){}
                activeParts.push(part);
            });

            try{ ToneLib.Transport.start(now); }catch(e){ console.warn('Transport start failed', e); }
            try{ print('\n[Audio] Playback started.'); }catch(e){}
        }catch(e){
            console.warn('Music failed to play', e);
        }
    }

    function stop(){
        try{
            if (ToneLib) ToneLib.Transport.stop();
        }catch(e){}
        activeParts.forEach(p=>{ try{ p.stop(); }catch(e){} });
        activeParts = [];
    }

    return { playMidi, stop };
})();

// stuff for the msusic
// fallback 
const AudioPlayer = (function(){
    let current = null;
    return {
        play: async function(file){
            try{
                // stop previous
                if (current){ try{ current.pause(); }catch(e){} current = null; }
                const audio = new Audio(encodeURI(file));
                audio.loop = true;
                audio.volume = 1.0;
                // attempt to play (pls work vro)
                await audio.play();
                current = audio;
                return true;
            }catch(e){
                console.warn('AudioPlayer failed to play', file, e);
                try{ if (current){ current.pause(); current = null; } }catch(_){}
                return false;
            }
        },
        stop: function(){
            try{ if (current){ current.pause(); current.currentTime = 0; current = null; } }catch(e){}
        }
    };
})();

// try mp3 first
function playTrack(key){
    const map = {
        'houses': 'Houses.mid',
        'caves': 'Caves.mid',
        'forests': 'Forests.mid',
        'crypt': 'Crypt.mid',
        'itadt': 'ITADT.mp3',
        'kokiri': 'mboss.mp3',
        'mboss': 'mboss.mp3',
        'boss': 'boss.mp3',
        'houses.mid': 'Houses.mid',
        'caves.mid': 'Caves.mid',
        'forests.mid': 'Forests.mid',
        'crypt.mid': 'Crypt.mid',
        'itadt.mid': 'ITADT.mp3',
        'mboss.mid': 'mboss.mp3',
        'boss.mid': 'boss.mp3'
    };
    const file = map[key.toLowerCase()] || key;
    // stop anything currently playing
    try{ MusicPlayer.stop(); }catch(e){}
    try{ AudioPlayer.stop(); }catch(e){}

    // attempt mp3s
    const mp3file = file.replace(/\.[^.]+$/, '.mp3');
    // try audio 
    AudioPlayer.play(mp3file).then(ok => {
        if (!ok){
            // fallback to MIDI
            try{ MusicPlayer.playMidi(file); }catch(e){ console.warn('Fallback MIDI play failed', e); }
        }
    }).catch(e=>{
        // fallback
        try{ MusicPlayer.playMidi(file); }catch(err){ console.warn('Fallback MIDI play failed', err); }
    });
}

// location prompter thing
function locationPrompt(title, description, choices){
    clear();
    print('\n' + title);
    print('\nplaceholder story here');
    print('(README section: ' + description + ')');
    print('\nWhere do you want to go next? Say one of these choices:');
    choices.forEach(c => print('\t' + c));
}

// shows the help command stuff
function showHelp(areaName, choices){
    print('\nAvailable commands for ' + areaName + ':');
    choices.forEach(c => print('\t' + c));
    print('\nNote: not every area can go directly to every other area. Use only the travel/interaction commands listed above.');
}

// locations 
function house(){
    currentLocation = 'house';
    const choices = ['exit house','inventory','help'];
    // play house ambience
    playTrack('houses');
    locationPrompt('House', 'Project Introduction', choices);

    function processInput(input){
        input = input.toLowerCase();
        if (input === 'help'){
            showHelp('House', choices);
            waitThenCall(house);
            return;
        }
        if (input === 'exit house' || input === 'exit') {
            print('\nYou step outside.');
            waitThenCall(cave);
        } else if (input === 'inventory'){
            print('\nInventory: ' + (inventory.length ? inventory.join(', ') : 'empty'));
            waitThenCall(house);
        } else {
            stayHere();
            waitThenCall(house);
        }
    }
    waitForInput(processInput);
}

function cave(){
    currentLocation = 'cave';
    const choices = ['pick up sticks','exit cave','help'];
    // play cave ambience
    playTrack('caves');
    locationPrompt('Cave', 'Timeline', choices);

    function processInput(input){
        input = input.toLowerCase();
        if (input === 'help'){
            showHelp('Cave', choices);
            waitThenCall(cave);
            return;
        }
        if (input === 'pick up sticks' || input === 'pick up stick' || input === 'pick sticks'){
            if (!inventory.includes('sticks')) inventory.push('sticks');
            print('\nYou picked up sticks.');
            waitThenCall(cave);
        } else if (input === 'exit cave' || input === 'exit'){
            print('\nYou leave the cave and arrive at Kokiri Village');
            waitThenCall(kokiriVillage);
        } else {
            stayHere();
            waitThenCall(cave);
        }
    }
    waitForInput(processInput);
}

function kokiriVillage(){
    currentLocation = 'village';
    const choices = ['enter house 1','enter house 2','enter house 3','enter forest','help'];
    locationPrompt('Kokiri Village', 'Map and village area', choices);

    function processInput(input){
        input = input.toLowerCase();
        if (input === 'help'){
            showHelp('Kokiri Village', choices);
            waitThenCall(kokiriVillage);
            return;
        }
        if (input === 'enter house 1' || input === 'house 1'){
            waitThenCall(kokiriHouse1);
        } else if (input === 'enter house 2' || input === 'house 2'){
            waitThenCall(kokiriHouse2);
        } else if (input === 'enter house 3' || input === 'house 3'){
            waitThenCall(kokiriHouse3);
        } else if (input === 'enter forest' || input === 'forest'){
            waitThenCall(forest);
        } else {
            stayHere();
            waitThenCall(kokiriVillage);
        }
    }
    waitForInput(processInput);
}

function kokiriHouse1(){
    currentLocation = 'house1';
    const choices = ['leave','help'];
    // play kokiri houses ambience
    playTrack('houses');
    locationPrompt('Kokiri House 1', 'Timeline', choices);
    function processInput(input){
        input = input.toLowerCase();
        if (input === 'help'){
            showHelp('Kokiri House 1', choices);
            waitThenCall(kokiriHouse1);
            return;
        }
        if (input === 'leave') kokiriVillage();
        else { stayHere(); waitThenCall(kokiriHouse1); }
    }
    waitForInput(processInput);
}

function kokiriHouse2(){
    currentLocation = 'house2';
    const choices = ['talk to falo','leave','help'];
    // play kokiri houses ambience
    playTrack('houses');
    locationPrompt('Kokiri House 2', 'Talk to Falo / Obtain blessing', choices);

    function processInput(input){
        input = input.toLowerCase();
        if (input === 'help'){
            showHelp('Kokiri House 2', choices);
            waitThenCall(kokiriHouse2);
            return;
        }
        if (input === 'talk to falo' || input === 'talk falo'){
            print('\nplaceholder story here');
            print('(README section: talk to Falo)');
            // check for the feather and the boss is defeated
                if (inventory.includes("roc's feather")){
                    // you murderer
                    if (kokiriWarriorAlive === false){
                        print('\nFalo glares at you. "You shed the blood of our kin. I cannot grant you the Forest\'s blessing."');
                        // lose boo
                        waitThenCall(function(){ badEnding(); });
                    } else {
                        forestBlessing = true;
                        print("\nYou obtained the Forest's blessing! (global: forestBlessing = true)");
                        // win yay
                        waitThenCall(function(){ winScreen(); });
                    }
                } else {
                    print('\nFalo says you need to bring proof of your courage.');
                }
        } else if (input === 'leave'){
            kokiriVillage();
        } else { stayHere(); waitThenCall(kokiriHouse2); }
    }
    waitForInput(processInput);
}

        function winScreen(){
            // stop any music and show win message
            try{ MusicPlayer.stop(); }catch(e){}
            clear();
            print('\nYOU WIN! Try different choices for a secret bad ending!');
            gameActive = false;
        }

function badEnding(){
    try{ MusicPlayer.stop(); }catch(e){}
    clear();
    print('\nBAD ENDING: Falo refuses to give you the Forest\'s blessing because you killed the Kokiri warrior.');
    print('\nTry different choices to find the good ending');
    gameActive = false;
}

function kokiriHouse3(){
    currentLocation = 'house3';
    const choices = ['leave','help'];
    // play kokiri houses ambience
    playTrack('houses');
    locationPrompt('Kokiri House 3', 'Shop or talk', choices);
    function processInput(input){
        input = input.toLowerCase();
        if (input === 'help'){
            showHelp('Kokiri House 3', choices);
            waitThenCall(kokiriHouse3);
            return;
        }
        if (input === 'leave') kokiriVillage(); else { stayHere(); waitThenCall(kokiriHouse3); }
    }
    waitForInput(processInput);
}

function forest(){
    currentLocation = 'forest';
    // forest music
    playTrack('forests');
    const choices = ['enter crypt','enter mini forest','return to village','help'];
    locationPrompt('Forest', 'Forest and Crypt area', choices);

    function processInput(input){
        input = input.toLowerCase();
        if (input === 'help'){
            showHelp('Forest', choices);
            waitThenCall(forest);
            return;
        }
        if (input === 'enter crypt' || input === 'crypt'){
            waitThenCall(crypt);
        } else if (input === 'enter mini forest' || input === 'mini forest'){
            waitThenCall(miniForest);
        } else if (input === 'return to village' || input === 'return'){
            MusicPlayer.stop();
            waitThenCall(kokiriVillage);
        } else { stayHere(); waitThenCall(forest); }
    }
    waitForInput(processInput);
}

function crypt(){
    currentLocation = 'crypt';
    // crypt ambience
    playTrack('crypt');
    const choices = ['fight kokiri warrior','spare kokiri warrior','leave','help'];
    locationPrompt('Crypt', 'Crypt - choose to fight or spare', choices);

    function processInput(input){
        input = input.toLowerCase();
        if (input === 'help'){
            showHelp('Crypt', choices);
            waitThenCall(crypt);
            return;
        }
        if (input === 'fight kokiri warrior' || input === 'fight'){
            // play kokiri warrior battle music
            playTrack('mboss');
            kokiriWarriorAlive = false;
            inventory.push('kokiri sword');
            print('\nYou killed the kokiri warrior and took the sword.');
            print('(README section: Bad Ending start)');
            waitThenCall(forest);
        } else if (input === 'spare kokiri warrior' || input === 'spare'){
            kokiriWarriorAlive = true;
            inventory.push('kokiri sword');
            print('\nYou spared the warrior and took the sword.');
            print('(README section: Good Ending start)');
            waitThenCall(forest);
        } else if (input === 'leave'){
            waitThenCall(forest);
        } else { stayHere(); waitThenCall(crypt); }
    }
    waitForInput(processInput);
}

function miniForest(){
    currentLocation = 'miniForest';
    const choices = ['enter ancient deku tree','leave','help'];
    locationPrompt('Mini Forest', 'Mini forest and Ancient Deku Tree', choices);

    function processInput(input){
        input = input.toLowerCase();
        if (input === 'help'){
            showHelp('Mini Forest', choices);
            waitThenCall(miniForest);
            return;
        }
        if (input === 'enter ancient deku tree' || input === 'ancient deku tree'){
            waitThenCall(ancientDekuTree);
        } else if (input === 'leave'){
            waitThenCall(forest);
        } else { stayHere(); waitThenCall(miniForest); }
    }
    waitForInput(processInput);
}

function ancientDekuTree(){
    currentLocation = 'ancientDekuTree';
    // ancient deku tree ambience
    playTrack('itadt');
    const choices = ['find rocs feather','enter boss room','leave','help'];
    locationPrompt('Ancient Deku Tree', 'Find Roc\'s feather and defeat Ghoma', choices);

    function processInput(input){
        input = input.toLowerCase();
        if (input === 'help'){
            showHelp('Ancient Deku Tree', choices);
            waitThenCall(ancientDekuTree);
            return;
        }
        if (input === "find rocs feather" || input === 'find feather'){
            if (!inventory.includes("roc's feather")) inventory.push("roc's feather");
            print('\nYou found Roc\'s feather.');
            waitThenCall(ancientDekuTree);
        } else if (input === 'enter boss room' || input === 'boss'){
            waitThenCall(bossRoom);
        } else if (input === 'leave'){
            waitThenCall(miniForest);
        } else { stayHere(); waitThenCall(ancientDekuTree); }
    }
    waitForInput(processInput);
}

function bossRoom(){
    currentLocation = 'bossRoom';
    // boss music
    playTrack('boss');
    printAscii("  _/\\_  \n (  o )  \n  \\\\__/   \n  /  \\");
    print('\nYou face the Ancient Ghoma.');
    print('\nplaceholder story here');
    print('(README section: Defeat ancient ghoma)');
    print('\nOptions: fight, flee, help');

    function processInput(input){
        input = input.toLowerCase();
        if (input === 'help'){
            showHelp('Boss Room', ['fight','flee','help']);
            waitThenCall(bossRoom);
            return;
        }
        if (input === 'fight'){
            // pretty simple, have sword = win 
            if (inventory.includes('kokiri sword')){
                print('\nYou defeated Ghoma and return with the feather to the village.');
                MusicPlayer.stop();
                waitThenCall(() => { waitThenCall(kokiriHouse2); });
            } else {
                print('\nYou fought bravely but lost.');
                MusicPlayer.stop();
                gameOver('lost to Ghoma');
            }
        } else if (input === 'flee'){
            MusicPlayer.stop();
            print('\nYou flee back to the mini forest.');
            waitThenCall(miniForest);
        } else { stayHere(); waitThenCall(bossRoom); }
    }
    waitForInput(processInput);
}

function gameOver(reason){
    clear();
    print('\nGame Over: ' + reason);
    print('\nplaceholder story here');
    print('(README section: Bad Ending)');
    gameActive = false;
}

// start
function start(){
    print('Welcome to the text adventure!');
    print('placeholder story here');
    print('(README section: Project Introduction)');
    function begin(input){
        house();
    }
    waitForInput(begin);
}