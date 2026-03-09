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
    print('\n'+ description);
    print('\nWhere do you want to go next? Say one of these choices:');
    choices.forEach(c => print('\t' + c));
}

// shows the help command stuff
function showHelp(areaName, choices){
    print('\nAvailable commands for ' + areaName + ':');
    choices.forEach(c => print('\t' + c));
    print('\nNote: not every area can go directly to every other area. Use only the travel/interaction commands listed above.');
}
function gonow(){
    print('\nType proceed to continue.')
}
// locations 
function house(){
    currentLocation = 'house';
    const choices = ['exit house','inventory','help'];
    // play house ambience
    playTrack('houses');
    locationPrompt('House', 'You awaken to your old friend Tael waking you. Tael explains that his sister, Tatl, got lost exploring the Ancient Deku Tree and has yet to return. He pleads your help. Guess it\'s time to adventure again!', choices);

    function processInput(input){
        input = input.toLowerCase();
        if (input === 'help'){
            showHelp('House', choices);
            gonow()
            waitThenCall(house);
            return;
        }
        if (input === 'exit house' || input === 'exit') {
            print('\nYou step outside.');
            gonow()
            waitThenCall(cave);
        } else if (input === 'inventory'){
            print('\nInventory: ' + (inventory.length ? inventory.join(', ') : 'empty'));
            gonow()
            waitThenCall(house);
        } else {
            stayHere();
            gonow()
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
    locationPrompt('Cave', 'You enter a dark cave just outside your house. Near the entrance there\'s a tree with loose branches.', choices);

    function processInput(input){
        input = input.toLowerCase();
        if (input === 'help'){
            showHelp('Cave', choices);
            gonow()
            waitThenCall(cave);
            return;
        }
        if (input === 'pick up sticks' || input === 'pick up stick' || input === 'pick sticks'){
            if (!inventory.includes('sticks')) inventory.push('sticks');
            print('\nYou picked up some sticks.');
            gonow()
            waitThenCall(cave);
        } else if (input === 'exit cave' || input === 'exit'){
            print('\nYou leave the cave and arrive at the Kokiri Village');
            gonow()
            waitThenCall(kokiriVillage);
        } else {
            stayHere();
            gonow()
            waitThenCall(cave);
        }
    }
    waitForInput(processInput);
}

function kokiriVillage(){
    currentLocation = 'village';
    const choices = ['enter house 1','enter house 2','enter house 3','enter forest','help'];
    locationPrompt('Kokiri Village', 'Entering into the Kokiri Village, you are hit with a sense of familiarity. These Kokiri, although not the ones you knew before, have grown quite accustomed to you. You see three houses you can go into.', choices);

    function processInput(input){
        input = input.toLowerCase();
        if (input === 'help'){
            showHelp('Kokiri Village', choices);
            gonow()
            waitThenCall(kokiriVillage);
            return;
        }
        if (input === 'enter house 1' || input === 'house 1'){
            gonow()
            waitThenCall(kokiriHouse1);
        } else if (input === 'enter house 2' || input === 'house 2'){
            gonow()
            waitThenCall(kokiriHouse2);
        } else if (input === 'enter house 3' || input === 'house 3'){
            gonow()
            waitThenCall(kokiriHouse3);
        } else if (input === 'enter forest' || input === 'forest'){
            gonow()
            waitThenCall(forest);
        } else {
            stayHere();
            gonow()
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
    locationPrompt('Kokiri House 1', 'Inside this house is a little Kokiri child. He seems to be skitish and runs away when you attempt to speak to him. Looking around there doesn\'t seem to be much to do here. It is best you leave.', choices);
    function processInput(input){
        input = input.toLowerCase();
        if (input === 'help'){
            showHelp('Kokiri House 1', choices);
            gonow()
            waitThenCall(kokiriHouse1);
            return;
        }
        if (input === 'leave') kokiriVillage();
        else { stayHere(); gonow(); waitThenCall(kokiriHouse1); }
    }
    waitForInput(processInput);
}

function kokiriHouse2(){
    currentLocation = 'house2';
    const choices = ['talk to falo','leave','help'];
    // play kokiri houses ambience
    playTrack('houses');
    locationPrompt('Kokiri House 2', 'Inside this house the Kokiri leader sits idly, watching the others roam about the forest. He notices you enter and spins around in his chair to look at you.', choices);

    function processInput(input){
        input = input.toLowerCase();
        if (input === 'help'){
            showHelp('Kokiri House 2', choices);
            gonow()
            waitThenCall(kokiriHouse2);
            return;
        }
        if (input === 'talk to falo' || input === 'talk falo'){
            if (!inventory.includes("roc's feather"))
            print('\nUpon explaining your situation to him, he warns you of the dangers of the Ancient Deku Tree. He speaks of a great evil found within, plaguing the village and causing many of the younger Kokiri to go missing. He speaks that if you were to defeat said evil, he might have some knowledge as to Tatl\'s location. He mentions a sword found inside a crypt guarded by an old Kokiri warrior. He asks that you DO NOT harm the warrior and simply take the sword and leave.');
            gonow()
            waitThenCall(kokiriHouse2);
            // check for the feather and the boss is defeated
                if (inventory.includes("roc's feather")){
                    // you murderer
                    if (kokiriWarriorAlive === false){
                        print('\nFalo glares at you. "You killed her... I refuse to aid you. Go to hell."');
                        // lose boo
                        gonow()
                        waitThenCall(function(){ badEnding(); });
                    } else {
                        forestBlessing = true;
                        print("\nFalo tell you of a fairy he saw leaving the Ancient Deku Tree. He says he spoke to the fairy and she said that she was on a mission to save the land from a \"great evil\". She flew away before he could ask any more questions though.");
                        // win yay
                        gonow()
                        waitThenCall(function(){ winScreen(); });
                    }
                }
        } else if (input === 'leave'){
            kokiriVillage();
        } else { stayHere(); gonow(); waitThenCall(kokiriHouse2); }
    }
    waitForInput(processInput);
}

        function winScreen(){
            // stop any music and show win message
            try{ MusicPlayer.stop(); }catch(e){}
            try{ AudioPlayer.stop();}catch(e){}
            clear();
            print('\nYOU WON THE DEMO! Try different choices for a secret bad ending!');
            gameActive = false;
        }

function badEnding(){
    try{ MusicPlayer.stop(); }catch(e){}
    try{ AudioPlayer.stop();}catch(e){}
    clear();
    print('\nBAD ENDING: Falo refuses to aid you because you killed the Kokiri warrior.');
    print('\nTry different choices to find the good ending');
    gameActive = false;
}

function kokiriHouse3(){
    currentLocation = 'house3';
    const choices = ['leave','help'];
    // play kokiri houses ambience
    playTrack('houses');
    locationPrompt('Kokiri House 3', 'Inside this Kokiri house is a shop. They sell numerous items from a shield, to a pouch for more inventory space. Unfortunately for you, you are flat broke. It is best you leave.', choices);
    function processInput(input){
        input = input.toLowerCase();
        if (input === 'help'){
            showHelp('Kokiri House 3', choices);
            gonow()
            waitThenCall(kokiriHouse3);
            return;
        }
        if (input === 'leave') kokiriVillage(); else { stayHere(); gonow(); waitThenCall(kokiriHouse3); }
    }
    waitForInput(processInput);
}

function forest(){
    currentLocation = 'forest';
    // forest music
    playTrack('forests');
    const choices = ['enter crypt','enter mini forest','return to village','help'];
    locationPrompt('Forest', 'Walking deeper into the forest you find a fork in the road. One way leads to a Crypt of some sorts. The other, to the Ancient Deku Tree. A faint flute plays in the background. Probably some Kokiri child.', choices);

    function processInput(input){
        input = input.toLowerCase();
        if (input === 'help'){
            showHelp('Forest', choices);
            gonow()
            waitThenCall(forest);
            return;
        }
        if (input === 'enter crypt' || input === 'crypt'){
            gonow()
            waitThenCall(crypt);
        } else if (input === 'enter mini forest' || input === 'mini forest'){
            gonow()
            waitThenCall(miniForest);
        } else if (input === 'return to village' || input === 'return'){
            MusicPlayer.stop();
            AudioPlayer.stop();
            gonow()
            waitThenCall(kokiriVillage);
        } else { stayHere(); gonow(); waitThenCall(forest); }
    }
    waitForInput(processInput);
}

function crypt(){
    currentLocation = 'crypt';
    // crypt ambience
    playTrack('crypt');
    const choices = ['fight kokiri warrior','spare kokiri warrior','leave','help'];
    locationPrompt('Crypt', 'Inside the Crypt a Kokiri warrior suddenly appears. She is swinging her sword around wildly. It is kinda hard to believe THIS is the Kokiri tribes greatest warrior. Nevertheless do you fight her or spare her?', choices);

    function processInput(input){
        input = input.toLowerCase();
        if (input === 'help'){
            showHelp('Crypt', choices);
            gonow()
            waitThenCall(crypt);
            return;
        }
        if (input === 'fight kokiri warrior' || input === 'fight'){
            // play kokiri warrior battle music
            playTrack('mboss');
            kokiriWarriorAlive = false;
            inventory.push('kokiri sword');
            print('\nYou killed the Kokiri warrior and took the sword. This action will have consequences...');
            gonow()
            waitThenCall(forest);
        } else if (input === 'spare kokiri warrior' || input === 'spare'){
            kokiriWarriorAlive = true;
            inventory.push('kokiri sword');
            print('\nYou spared the Kokiri warrior and took the sword. She seems surprised and falters for a second before regaining her guard. It is best you leave.');
            gonow()
            waitThenCall(forest);
        } else if (input === 'leave'){
            gonow()
            waitThenCall(forest);
        } else { stayHere(); gonow(); waitThenCall(crypt); }
    }
    waitForInput(processInput);
}

function miniForest(){
    currentLocation = 'miniForest';
    const choices = ['enter ancient deku tree','leave','help'];
    locationPrompt('Mini Forest', 'Walking through the forest you find the Ancient Deku Tree. It is twice, maybe even thrice the size of the Deku Tree you once knew. Outside it Deku Babas threaten you were their strong jaws.', choices);

    function processInput(input){
        input = input.toLowerCase();
        if (input === 'help'){
            showHelp('Mini Forest', choices);
            gonow()
            waitThenCall(miniForest);
            return;
        }
        if (input === 'enter ancient deku tree' || input === 'ancient deku tree'){
            waitThenCall(ancientDekuTree);
            gonow()
        } else if (input === 'leave'){
            gonow()
            waitThenCall(forest);
        } else { stayHere(); gonow(); waitThenCall(miniForest); }
    }
    waitForInput(processInput);
}

function ancientDekuTree(){
    currentLocation = 'ancientDekuTree';
    // ancient deku tree ambience
    playTrack('itadt');
    const choices = ['look around','enter boss room','leave','help'];
    locationPrompt('Ancient Deku Tree', 'Going into the Ancient Deku Tree there\'s many winding..hallways? If you look around there\'s a chance you could find something important.', choices);

    function processInput(input){
        input = input.toLowerCase();
        if (input === 'help'){
            showHelp('Ancient Deku Tree', choices);
            gonow()
            waitThenCall(ancientDekuTree);
            return;
        }
        if (input === "look around" || input === 'find feather'){
            if (!inventory.includes("roc's feather")) inventory.push("roc's feather");
            print('\nLooking around the place you find a massive chest. Opening it you find it\'s.. empty? Wait no. There\'s a singular feather inside. Upon grabing it, it quadruples in size. On it, there\'s a label. \"Roc\'s Feather.\" Holding this you feel like you could maybe gain some extra height on a jump.');
            gonow()
            waitThenCall(ancientDekuTree);
        }else if (input === 'enter boss room' || input === 'boss') {
    if (inventory.includes("roc's feather")) {
        clear();
        bossRoom();
    } else {
        print('\nThere is a MASSIVE gap between you and the Boss Room. There is no plausible way to get across at the moment.');
        gonow()
        waitThenCall(ancientDekuTree);
    }
        } else if (input === 'leave'){
            gonow()
            waitThenCall(miniForest);
        } else { stayHere(); gonow(); waitThenCall(ancientDekuTree); }
    }
    waitForInput(processInput);
}

function bossRoom(){
    currentLocation = 'bossRoom';
    // boss music
    playTrack('boss');
    print('\nUtilizing Roc\'s Feather, you jump across the gap to the Boss Room with ease.')
    printAscii("  _/\\_  \n (  o )  \n  \\\\__/   \n  /  \\");
    print('\nYou face the Ancient Ghoma.');
    print('\nA horrendous beast, double the size of the one you\'ve fought before. It\'s roar makes you tremble.');
    print('\nOptions: fight, flee, help');

    function processInput(input){
        input = input.toLowerCase();
        if (input === 'help'){
            showHelp('Boss Room', ['fight','flee','help']);
            gonow()
            waitThenCall(bossRoom);
            return;
        }
        if (input === 'fight'){
            // pretty simple, have sword = win 
            if (inventory.includes('kokiri sword')){
                print('\nAfter a feroucious battle, you finally defeat Ghoma and return with it\'s eye as proof to the village.');
                MusicPlayer.stop();
                AudioPlayer.stop();
                gonow()
                waitThenCall(kokiriVillage)
            } else {
                MusicPlayer.stop();
                AudioPlayer.stop();
                gameOver('You fought bravely but lost to Ghoma.');
            }
        } else if (input === 'flee'){
            MusicPlayer.stop();
            AudioPlayer.stop();
            print('\nYou flee back to the mini forest.');
            gonow()
            waitThenCall(miniForest);
        } else { stayHere(); gonow(); waitThenCall(bossRoom); }
    }
    waitForInput(processInput);
}

function gameOver(reason){
    clear();
    print('\nGame Over: ' + reason);
    print('\nReload to try again!');
    gameActive = false;
}

// start
function start(){
    print('Welcome to the text adventure!');
    print('After defeating the evil threatening Termina, the Hero of Time, Link, continued searching for his lost friend, his fairy; Navi. Yet after 15 long years, hope had all but faded. He returned to wander once again through the mystical Lost Woods. He soon found himself in a new land called Valana. It seemed as good a place as any to start a new life. He lived here in quiet peace for several years. However, something about the land of Valana always felt off, felt… sinister.');
    print('This text based adventure game is based off the romhack known as The Legend of Zelda: Indigo by Kenton M.')
    gonow()
    function begin(input){
        house();
    }
    waitForInput(begin);
}