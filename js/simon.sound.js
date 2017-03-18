/*
* simon.sound.js
* sound module
*/

simon.sound = (function () {
    "use strict";

    //----------------------- BEGIN MODULE SCOPE VARIABLES -----------------------
    //  soundsMap - a map of all sounds. for color game buttons, the map key will be colorButton0, colorButton1, colorButton2, colorButton3
    //               for fail sound, the key will be fail
    //  soundsArray - an array of all sounds. This array will allow fetching sound based on the numbers in the game sequence of notes. The
    //                  game sequence of notes is an array of random integers from 0 - 3. These integers will be indexes into the soundsArray.
    var soundsMap = new Map(),
        soundsArray = [];    

    // getSound
    // Purpose : Looks up a sound in either the soundsMap or the soundsArray depending on the mapKeyOrArrayIndex parameter
    // Parameters:
    //      * mapKeyOrArrayIndex - may be the key for looking up the sound in soundsMap or may be an integer from 0 - 3, for looking up the sound in soundsArray
    function getSound (mapKeyOrArrayIndex) {
        var sound;

        if (typeof mapKeyOrArrayIndex === "number" && 0 <= mapKeyOrArrayIndex && mapKeyOrArrayIndex <= 3) {
            sound = soundsArray[mapKeyOrArrayIndex];
        } else {
            sound = soundsMap.get(mapKeyOrArrayIndex);
        }

        if (!sound) {
            throw new Error('simon.sound.getSound: unable to get sound for ', mapKeyOrArrayIndex);
        } else {
            return sound;
        }
        return null;
    }

    function init () {
        createSound('colorButton0');
        createSound('colorButton1');
        createSound('colorButton2');
        createSound('colorButton3');
        createSound('fail');

        function createSound(id) {
            var sound = document.createElement('audio');
            sound.setAttribute('src', 'media/sound_' + id + '.mp3');
            soundsMap.set(id, sound);
            soundsArray.push(sound);
        }
    }

    // play
    // Purpose      : plays a sound
    // Parameters
    //      * mapKeyOrArrayIndex - may be the key for looking up the sound in soundsMap or may be an integer from 0 - 3, for looking up the sound in soundsArray
    //      * durationMilliseconds - optional parameter - if passed, this is the duration of the note in milliseconds. If not passed, the note will be 
    //          played in it's entirity (total length of the mp3's is 5 seconds) or until the note is paused
    function play(mapKeyOrArrayIndex, durationMilliseconds) {
        var promise,
            sound = getSound(mapKeyOrArrayIndex);

        sound.currentTime = 0;
        sound.play(),

        promise = new Promise(function(resolve, reject) {
            if (durationMilliseconds) {
                setTimeout(function () {
                    sound.pause();
                    resolve();
                }, durationMilliseconds);
            } else {
                resolve();
            }        
        });

        return promise;
    }

    //pause
    //pauses a sound
    function pause(mapKeyOrArrayIndex) {
        var sound = getSound(mapKeyOrArrayIndex);
        sound.pause();
    }


    //return the public api
    return {
        init        : init,
        play        : play,
        pause       : pause
    };

} ());