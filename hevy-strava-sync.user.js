// ==UserScript==
// @name         Hevy to Strava Strength Sync
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Syncs Hevy workout sets to existing Strava strength activities in-place
// @author       aslan91
// @match        https://www.strava.com/activities/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @connect      api.hevyapp.com
// ==/UserScript==

(function() {
    'use strict';

    // 1. Helper: Add Sync Button to DOM
    function injectButton() {
        const actionContainer = document.querySelector('.btn-group') || document.querySelector('.activity-summary-actions');
        if (!actionContainer || document.getElementById('hevy-sync-btn')) return;

        const syncBtn = document.createElement('button');
        syncBtn.id = 'hevy-sync-btn';
        syncBtn.className = 'btn btn-default btn-sm';
        syncBtn.style.marginLeft = '10px';
        syncBtn.style.backgroundColor = '#FC6100';
        syncBtn.style.color = '#FFFFFF';
        syncBtn.style.border = 'none';
        syncBtn.innerText = 'Sync Hevy Sets';
        syncBtn.addEventListener('click', handleSync);

        actionContainer.appendChild(syncBtn);
    }

    // 2. Helper: Retrieve CSRF Token from DOM
    function getCsrfToken() {
        return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    }

    // 3. Helper: Extract Activity ID from URL
    function getActivityId() {
        const match = window.location.pathname.match(/\/activities\/(\d+)/);
        return match ? match[1] : null;
    }

    // 4. Hevy API Request
    function fetchHevyWorkouts(apiKey) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: 'https://api.hevyapp.com/v1/workouts?limit=5',
                headers: {
                    'auth-token': apiKey,
                    'Accept': 'application/json'
                },
                onload: function(response) {
                    if (response.status === 200) {
                        try {
                            const data = JSON.parse(response.responseText);
                            resolve(data);
                        } catch (e) {
                            reject('Failed to parse Hevy response');
                        }
                    } else {
                        reject(`Hevy API Error: ${response.statusText}`);
                    }
                },
                onerror: function(error) {
                    reject(error);
                }
            });
        });
    }

    // 5. Update Strava Activity
    function updateStravaActivity(activityId, csrfToken, exercises) {
        return new Promise((resolve, reject) => {
            const payload = {
                activity: {
                    workout_log: {
                        exercises: exercises
                    }
                }
            };

            GM_xmlhttpRequest({
                method: 'PUT',
                url: `https://www.strava.com/activities/${activityId}`,
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                data: JSON.stringify(payload),
                onload: function(response) {
                    if (response.status === 200) {
                        resolve(response.responseText);
                    } else {
                        reject(`Strava update failed: ${response.statusText}`);
                    }
                },
                onerror: function(error) {
                    reject(error);
                }
            });
        });
    }

    // 6. Match and Map Workouts
    function matchWorkout(hevyWorkouts, stravaTime) {
        const sTime = new Date(stravaTime).getTime();
        // Look for workout within a 3-hour window
        const windowMs = 3 * 60 * 60 * 1000;

        return hevyWorkouts.find(w => {
            const wTime = new Date(w.start_time).getTime();
            return Math.abs(wTime - sTime) <= windowMs;
        });
    }

    // 7. Core Sync Execution
    async function handleSync() {
        const activityId = getActivityId();
        const csrfToken = getCsrfToken();

        if (!activityId || !csrfToken) {
            alert('Unable to extract Strava metadata.');
            return;
        }

        let hevyKey = GM_getValue('hevy_api_key');
        if (!hevyKey) {
            hevyKey = prompt('Enter Hevy Pro API Key:');
            if (hevyKey) {
                GM_setValue('hevy_api_key', hevyKey);
            } else {
                return;
            }
        }

        const btn = document.getElementById('hevy-sync-btn');
        btn.disabled = true;
        btn.innerText = 'Syncing...';

        try {
            // Get Hevy Workouts
            const response = await fetchHevyWorkouts(hevyKey);
            const workouts = response.workouts || response;

            // Fetch Strava Activity start time from DOM/meta
            // Fallback to today's date if element not found
            let stravaTime = new Date();
            const timeEl = document.querySelector('time[datetime]') || document.querySelector('.activity-metadata time');
            if (timeEl) {
                stravaTime = timeEl.getAttribute('datetime');
            }

            const matchedHevy = matchWorkout(workouts, stravaTime);
            if (!matchedHevy) {
                alert('No matching Hevy workout found within 3 hours of Strava activity.');
                btn.disabled = false;
                btn.innerText = 'Sync Hevy Sets';
                return;
            }

            // Map Hevy exercises to Strava format
            const mappedExercises = matchedHevy.exercises.map(ex => {
                return {
                    name: ex.title,
                    sets: ex.sets.map((set, idx) => ({
                        index: idx,
                        reps: set.reps || 0,
                        weight: set.weight_kg || 0,
                        set_type: set.indicator === 'warmup' ? 'warmup' : 'normal'
                    }))
                };
            });

            // Update Strava Activity
            await updateStravaActivity(activityId, csrfToken, mappedExercises);

            alert('Workout sets successfully synced!');
            window.location.reload();

        } catch (err) {
            alert(`Error: ${err}`);
            btn.disabled = false;
            btn.innerText = 'Sync Hevy Sets';
        }
    }

    // Run Injection
    setInterval(injectButton, 1000);
})();
