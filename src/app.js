import { config } from './data/config.js';
import { dragons, getDragon } from './data/dragons.js';
import { foods } from './data/foods.js';
import { furniture, slots } from './data/furniture.js';
import { quests } from './data/quests.js';
import { weeklyPool as defaultWeeklyPool } from './data/quests/weekly.js';
import { createStore } from './store/store.js';
import { makeBackup, backupFileName } from './core/backup.js';
import { saveFile as defaultSaveFile } from './ui/saveFile.js';
import { localStorageBackend } from './store/localStorageBackend.js';
import { createAudio } from './audio/audio.js';
import { createReminders } from './platform/reminders.js';
import { tones } from './audio/tones.js';
import { showQuestToast } from './ui/questToast.js';
import { showTimerPill, hideTimerPill } from './ui/timerPill.js';
import { assetUrl } from './ui/art.js';
import { createScreenManager } from './ui/screens.js';
import { renderTitleScreen } from './ui/titleScreen.js';
import { renderCreditsScreen } from './ui/creditsScreen.js';
import { credits } from './data/credits.js';
import { renderInstructionsScreen } from './ui/instructionsScreen.js';
import { renderChooseDragon } from './ui/chooseDragon.js';
import { renderChooseFamily } from './ui/chooseFamily.js';
import { families, getFamily, familiesBackdrop } from './data/families.js';
import { renderMainScreen, updateMainScreen } from './ui/mainScreen.js';
import { renderShopScreen } from './ui/shopScreen.js';
import { renderRecordScreen } from './ui/recordScreen.js';
import { renderLairScreen } from './ui/lairScreen.js';
import { renderUnlockLair } from './ui/unlockLairScreen.js';
import { renderSettingsScreen } from './ui/settingsScreen.js';
import { showLevelUp } from './ui/levelUp.js';
import { createTimerState, start, pause, tick, advance, secondsForMode } from './core/timer.js';
import { grantWorkReward, buyFood, leveledUp, dragonXp } from './core/game.js';
import { currentLevel } from './core/dragon.js';
import { lairOf, buyFurniture, placeItem, unlockLair } from './core/lair.js';
import { canAfford } from './core/wallet.js';
import { payQuests } from './core/quests.js';
import { rollWeek, payWeekly, countFoodBought, countItemBought } from './core/weekly.js';
import { recordBlock, pruneHistory } from './core/history.js';
import { resolveTheme, applyPalette, applyBackdrop, clearTheme } from './ui/theme.js';
import { createTranslator } from './i18n/i18n.js';

// What she is told when a block ends while she is not looking at the screen. A finished
// work block invites the break; a short break calls her back; the long break closes the round.
const endOfBlockNotice = (mode, t) => ({ title: t(`notice.${mode}.title`), body: t(`notice.${mode}.body`) });

export const createApp = (root, {
  now = () => Date.now(), audioFactory = createAudio, remindersFactory = createReminders,
  saveFile = defaultSaveFile, reload = () => window.location.reload(),
  // Where the save lives: localStorage on the web, native storage in the Android app.
  backend = localStorageBackend,
  weeklyPool = defaultWeeklyPool,
} = {}) => {
  const store = createStore(backend, config);
  let state = store.load();
  // A save can name a style this build no longer ships; fall back rather than hand the
  // audio an undefined playlist and lose the music silently.
  // Music paths are authored from the site root like the art, so they must be resolved
  // against the deploy base too, or the tracks 404 when served from a subpath.
  const playlistFor = (style) =>
    (config.music[style] ?? config.music[config.musicStyles[0]]).map(assetUrl);
  const effects = Object.fromEntries(Object.entries(config.effects).map(([name, path]) => [name, assetUrl(path)]));
  const audio = audioFactory({ music: playlistFor(state.settings.musicStyle), effects, tones });
  audio.setMuted(state.muted);
  const reminders = remindersFactory();
  // The browser keeps the state as 'default' if the prompt is dismissed, so asking only
  // while undecided is not enough to avoid nagging; remember that we already asked.
  let askedPermission = false;
  let lastReward = null; // coins from the block just completed, shown until the next one starts
  // Settings-derived durations are recomputed; only the volatile part is restored.
  // The saved countdown can outlive the length it belongs to: durations come from the
  // settings, `remaining` comes from the save, and nothing tied them together. Clamp on
  // load so a state written by an older build cannot start the timer out at fourteen
  // minutes inside a one-minute block.
  const restored = { ...createTimerState(state.settings), ...state.timer };
  let timerState = {
    ...restored,
    remaining: Math.min(restored.remaining, secondsForMode(restored, restored.mode)),
  };

  const save = () => store.save(state);

  // Every screen speaks the saved language. It changes only on a Settings save, which
  // rebuilds the translator and redraws.
  let t = createTranslator(state.settings.language);

  // Quests are read from state that already exists, so any change to that state may finish
  // one. Every site that changes it settles first and saves after, in one write. The paid
  // list makes this safe to call as often as needed: a quest that has paid never pays again.
  const questWorld = { furniture, slots, dragons };
  // The weekly ones roll into the current week first, so a quest of a week that is over pays
  // nothing and its week's paid list goes with it. A quest paid by something she just did,
  // permanent or weekly, gets its own sound; on load it stays quiet: the page has had no
  // gesture yet, and the work behind it was done in an earlier session.
  // A quest paid, by anything, also dots the Record icon until Record is opened, so a child
  // who missed the note still finds out. Held in memory only: it is a hint, not progress.
  let questNews = false;
  const settleQuests = ({ sound = true } = {}) => {
    const at = now();
    state = rollWeek(state, weeklyPool, at);
    const permanentBefore = new Set(state.questsPaid ?? []);
    const weeklyBefore = new Set(state.weekly?.paid ?? []);
    state = payWeekly(payQuests(state, quests, questWorld), weeklyPool, at);
    const paid = [
      ...quests.filter((q) => (state.questsPaid ?? []).includes(q.id) && !permanentBefore.has(q.id)),
      ...weeklyPool.filter((q) => (state.weekly?.paid ?? []).includes(q.id) && !weeklyBefore.has(q.id)),
    ];
    if (!paid.length) return;
    questNews = true;
    if (!sound) return;
    audio.playEffect('quest');
    showQuestToast(paid, t);
  };

  // A save that predates quests, or one that earned a quest while the app was closed, is
  // settled on load: the work was done, so it counts. Drawing the week alone is no reason to
  // write: the draw follows from the save, so the next load would draw the same three.
  state = rollWeek(state, weeklyPool, now());
  const loaded = state;
  settleQuests({ sound: false });
  if (state !== loaded) save();

  // Persist only the volatile timer fields so a reload can resume the session, including a
  // finished round that is still waiting to be acknowledged.
  const persistTimer = () => {
    const { mode, running, remaining, endsAt, completedWork, roundComplete } = timerState;
    state = { ...state, timer: { mode, running, remaining, endsAt, completedWork, roundComplete } };
    save();
  };

  const render = () => {
    hideTimerPill();
    if (!state.dragonId) return onChangeDragon(null);
    const dragon = getDragon(state.dragonId);
    const theme = resolveTheme(dragon.themeId);
    applyPalette(theme.palette);
    applyBackdrop(theme.backdrop);
    screens.set('main', renderMainScreen({
      state, dragon, xp: dragonXp(state), timerState, lastReward, theme,
      lairPrice: config.lairUnlockPrice,
      onStart, onPause, onBreak, onShop, onLair, onRecord, onSettings, onToggleMute, questNews, t,
      onBack: () => onChangeDragon(showTitle, dragon.family),
      // Cats purr; every other creature chitters.
      onPet: () => audio.playEffect(dragon.family === 'cats' ? 'purr' : 'chitter'),
    }));
    screens.show('main');
  };

  // The front door, shown on every launch. It needs no dragon, so it is not themed and
  // never reads the save: Start hands over to render(), which is where the app used to open.
  const showTitle = () => {
    clearTheme();
    // With a creature saved, carrying on is the primary button and goes straight to the timer;
    // the families (and from there any creature) stay one tap away for a change of mind.
    const current = getDragon(state.dragonId);
    screens.set('title', renderTitleScreen({
      onStart: () => onChangeDragon(showTitle), onInstructions: showInstructions, onCredits: showCredits, t,
      continueWith: current ? {
        name: current.name,
        image: currentLevel(current, dragonXp(state)).image,
        onContinue: render,
      } : undefined,
    }));
    screens.show('title');
  };

  const showCredits = () => {
    screens.set('credits', renderCreditsScreen({ credits, onBack: showTitle, t }));
    screens.show('credits');
  };

  const showInstructions = () => {
    clearTheme();
    screens.set('instructions', renderInstructionsScreen({ onBack: showTitle, settings: state.settings, t }));
    screens.show('instructions');
  };

  // A backup is the game as it is now: write it first, so the file and storage agree.
  // Returns how it went (see saveFile); the backup panel turns that into a note for the child.
  const onBackup = () => {
    save();
    return saveFile(backupFileName(now()), makeBackup(state, now()));
  };

  // A restore replaces the whole game. Stop everything that could still write the old one,
  // store the backup through the same migration as a load, and start the app again from it,
  // so quests, the timer and the music all come up through the normal start-up path.
  const onRestore = (backup) => {
    stop();
    // The game being replaced is kept aside first. If the browser refuses the write (storage
    // full), the old game is still stored as it was; restarting brings the app back up on it.
    // Keeping the copy is a bonus: if it does not fit, the restore still goes ahead.
    try { store.keepPrevious(); } catch { /* no room for the copy */ }
    try { store.save(store.fromSave(backup)); } catch { /* old game kept */ }
    reload();
  };

  // --- handlers ---
  // Confirming the dragon already in play must not rewrite the save file. The front door now
  // sends everyone through this screen on every launch, so confirming is the common case and
  // changing is the rare one; a write on every start would be pure churn.
  const onPick = (id) => {
    if (id === state.dragonId) return render();
    state = { ...state, dragonId: id };
    save();
    render();
  };

  // onBack is the screen the child came from: the title for Start, Settings for Change Dragon,
  // none on a first run with nothing behind it. The families come first; the creature chooser
  // then goes back to them, so the child can browse another family before choosing. With a
  // familyId it opens straight on that family's chooser, still backed by the families.
  const onChangeDragon = (onBack, familyId) => {
    const showFamilies = () => {
      clearTheme();
      screens.set('families', renderChooseFamily({
        families, creatures: dragons, onPick: showCreatures, onBack: onBack ?? undefined,
        backdrop: familiesBackdrop,
        currentFamilyId: getDragon(state.dragonId)?.family, t,
      }));
      screens.show('families');
    };
    const showCreatures = (familyId) => {
      clearTheme();
      screens.set('choose', renderChooseDragon({
        dragons: dragons.filter((d) => d.family === familyId), family: getFamily(familyId),
        onPick, currentId: state.dragonId, onBack: showFamilies, t,
      }));
      screens.show('choose');
    };
    if (familyId) showCreatures(familyId);
    else showFamilies();
  };

  const onStart = () => {
    lastReward = null;
    timerState = start(timerState, now());
    persistTimer();
    audio.unlock();
    audio.playMusic();
    // The first Start is the first user gesture, which a permission prompt requires.
    if (!askedPermission && reminders.permission === 'default') {
      askedPermission = true;
      reminders.request();
    }
    reminders.keepAwake();
    render();
  };
  const onPause = () => {
    timerState = pause(timerState, now());
    persistTimer();
    reminders.release();
    render();
  };

  const onBreak = () => {
    lastReward = null;
    timerState = start(advance(timerState), now());
    persistTimer();
    reminders.keepAwake();
    render();
  };

  // Every action that changes the game ends the same way: quests are settled (a purchase or a
  // placed piece may finish one) and the result is saved, in that order, in one write.
  const commit = (next) => {
    state = next;
    settleQuests();
    save();
  };
  const currentTheme = () => resolveTheme(getDragon(state.dragonId).themeId);

  const onShop = () => {
    const dragon = getDragon(state.dragonId);
    screens.set('shop', renderShopScreen({
      state, foods, theme: currentTheme(), t,
      onBuy: (food) => {
        const oldXp = dragonXp(state);
        commit(countFoodBought(buyFood(state, food), weeklyPool, now()));
        audio.playEffect('eat');
        const newXp = dragonXp(state);
        if (leveledUp(dragon, oldXp, newXp)) {
          showLevelUp(dragon, currentLevel(dragon, newXp),
            () => audio.playEffect('levelup'), t);
        }
        onShop(); // re-render shop with updated coins/xp
      },
      onBack: render,
    }));
    screens.show('shop');
  };

  // The one place the lair is gated: it is the only place that shows the lair screen, so a
  // single check is a complete gate. The core rules are deliberately not gated; with no
  // screen there is no path to them.
  const onLair = () => {
    if (!state.lairUnlocked) return onUnlockOffer();
    const dragon = getDragon(state.dragonId);
    screens.set('lair', renderLairScreen({
      state, dragon, xp: dragonXp(state), theme: currentTheme(), furniture,
      onBuy: onBuyItem, onPlace: onPlaceItem, onBack: render, t,
    }));
    screens.show('lair');
  };

  const onUnlockOffer = () => {
    screens.set('unlock', renderUnlockLair({
      state, price: config.lairUnlockPrice, theme: currentTheme(),
      onConfirm: onConfirmUnlock, onBack: render, t,
    }));
    screens.show('unlock');
  };

  // Re-enter onLair rather than opening the room here, so the post-unlock path and the
  // already-unlocked path are the same lines and cannot drift.
  // The purse is re-checked here like in onBuyItem: unlockLair throws on too few coins, and
  // the screen's own guard only knows the purse as it was when it was drawn.
  const onConfirmUnlock = () => {
    if (!state.lairUnlocked && !canAfford(state.coins, config.lairUnlockPrice)) return;
    commit(unlockLair(state, config.lairUnlockPrice));
    onLair();
  };

  // Buying and placing are mutually exclusive in core: placing needs an owned item, buying
  // an unowned one, and a wrong branch throws rather than quietly charging twice. The shelf
  // already routes by state, but ownership and the purse are re-checked here so no stale or
  // forged tap can reach the wrong branch or overspend. buyFurniture writes the slot itself.
  const onBuyItem = (item) => {
    const { owned } = lairOf(state, state.dragonId);
    if (owned.includes(item.id) || !canAfford(state.coins, item.price)) return;
    commit(countItemBought(buyFurniture(state, item), weeklyPool, now()));
    onLair(); // rebuild so the room and the shelf both show the new piece
  };

  const onPlaceItem = (item) => {
    const { owned } = lairOf(state, state.dragonId);
    if (!owned.includes(item.id)) return;
    commit(placeItem(state, item));
    onLair();
  };

  // Read-only: nothing here changes the save, so there is nothing to re-render on return.
  const onRecord = () => {
    questNews = false;
    // A week can turn while the app stays open; the Record shows the week it is now. Like the
    // draw on load, this only follows from the date, so it does not write the save.
    state = rollWeek(state, weeklyPool, now());
    screens.set('record', renderRecordScreen({
      state, now: now(), theme: currentTheme(), onBack: render,
      quests, world: questWorld, t,
      // This week's draw, resolved against the pool; an id the pool no longer has is skipped.
      weekly: (state.weekly?.ids ?? []).map((id) => weeklyPool.find((q) => q.id === id)).filter(Boolean),
    }));
    screens.show('record');
  };

  const onSettings = () => {
    screens.set('settings', renderSettingsScreen({
      settings: state.settings, config, onChangeDragon: () => onChangeDragon(onSettings),
      onBackup, onRestore, t,
      onSave: (settings) => {
        const styleChanged = settings.musicStyle !== state.settings.musicStyle;
        const languageChanged = settings.language !== state.settings.language;
        state = { ...state, settings };
        if (styleChanged) audio.setPlaylist(playlistFor(settings.musicStyle));
        // The baked durations always follow the saved settings, running or not: the next
        // break and the next cycle are read from them, and a stale copy would keep using the
        // old values until a reload.
        const workSeconds = settings.workMinutes * 60;
        const atFreshWorkStart =
          timerState.mode === 'work' && timerState.remaining === timerState.workSeconds;
        const rebaked = {
          ...timerState,
          workSeconds,
          breakSeconds: settings.breakMinutes * 60,
          longBreakSeconds: settings.longBreakMinutes * 60,
          sessionsBeforeLongBreak: settings.sessionsBeforeLongBreak,
        };
        timerState = rebaked;
        // Only the countdown is protected while a block runs: it keeps the time it has.
        if (!rebaked.running) {
          // Never leave the countdown longer than the length it now belongs to. Keeping
          // a part-used block intact is worth doing, but a few seconds of accidental
          // progress used to lock the new duration out entirely: set work to 1 minute
          // with 14:48 on the clock and the clock stayed at 14:48.
          const limit = secondsForMode(rebaked, rebaked.mode);
          timerState = {
            ...rebaked,
            remaining: atFreshWorkStart ? workSeconds : Math.min(rebaked.remaining, limit),
          };
        }
        persistTimer();
        // A new language redraws Settings in it at once; nothing else in the save changes.
        // When the save came from the leave-or-save card, the exit it leads to runs next
        // and draws its own screen in the new language.
        if (languageChanged) {
          t = createTranslator(settings.language);
          if (screens.current === 'settings') onSettings();
        }
      },
      onBack: render,
    }));
    screens.show('settings');
  };

  const onToggleMute = () => {
    audio.unlock();
    const muted = audio.toggleMute();
    state = { ...state, muted };
    save();
    if (muted) audio.stopMusic(); else audio.playMusic();
    render();
  };

  const screens = createScreenManagerWithCache(root);

  // --- per-second driver ---
  const handleTick = () => {
    if (!timerState.running) return;
    // When the block really ended. tick() clears endsAt, and a block that ended while the app
    // was closed must be recorded on that day, not on the day the app is next opened.
    const endedAt = Math.min(timerState.endsAt ?? now(), now());
    const result = tick(timerState, now());
    timerState = result.state;
    if (result.completed) {
      const ended = timerState.mode;
      audio.playEffect('bell');
      reminders.release();
      // In front of her, the bell and the dragon already do the job; a notification
      // would only be noise.
      // notify is async and fire-and-forget here; the catch is a backstop so a rejection
      // can never surface as an unhandled one.
      if (document.visibilityState !== 'visible') {
        Promise.resolve(reminders.notify(endOfBlockNotice(ended, t))).catch(() => {});
      }
      if (timerState.mode === 'work') {
        // work finished → grant coins; stays at 0:00 so the ☕ Break button shows
        const before = state.coins;
        state = grantWorkReward(state, config, timerState.workSeconds / 60);
        lastReward = state.coins - before;
        // Only work is an achievement: a finished break records nothing.
        const minutes = timerState.workSeconds / 60;
        state = {
          ...state,
          // Counted beside the history so the two can never disagree; pruning never touches it.
          lifetimeBlocks: (state.lifetimeBlocks ?? 0) + 1,
          history: pruneHistory(
            recordBlock(state.history, endedAt, minutes), now(), config.historyDays,
          ),
        };
        // After the block's own coins are counted, so the banner still says what the block paid.
        settleQuests();
      } else {
        // break finished → return to a fresh idle work block (▶ Start shows)
        timerState = advance(timerState);
      }
      persistTimer();
    }
    if (screens.current !== 'main') {
      // Away from the timer, the clock stays in sight in a pill that leads back to it.
      if (timerState.running) {
        const phase = { work: 'main.focus', break: 'main.break', longBreak: 'main.longBreak' }[timerState.mode];
        showTimerPill({ label: t(phase), remaining: timerState.remaining, onTap: render });
      } else hideTimerPill();
      return;
    }
    // Completion changes structure (reward, mode label, controls); a plain tick only the clock.
    if (result.completed) render();
    else updateMainScreen(screens.get('main'), { timerState });
  };

  // A hidden page can have its interval throttled or suspended, and the browser drops the
  // wake lock on hide. On return, settle a block that ended meanwhile right away rather
  // than on the next tick, then take the lock back if a block is still running.
  const onVisibilityChange = () => {
    if (document.visibilityState !== 'visible') return;
    handleTick();
    if (timerState.running) reminders.keepAwake();
  };
  document.addEventListener('visibilitychange', onVisibilityChange);

  // Another tab wrote the save: this tab's copy is now old, and its next write would wipe that
  // progress. Stop and reload onto the newer save instead.
  const onStorage = (event) => {
    // key is null when another tab cleared all of the storage, which changes the save too.
    if (event.key !== config.storageKey && event.key !== null) return;
    stop();
    reload();
  };
  window.addEventListener('storage', onStorage);

  const interval = setInterval(handleTick, 1000);
  handleTick(); // settle a session restored from a previous run (completes it once)
  if (timerState.running) reminders.keepAwake(); // a restored block is still running

  // A block that is running, or one that ended and waits to be acknowledged, belongs on the
  // timer: a reload or a silent update must not hide it behind the title.
  const blockInPlay = timerState.running
    || (timerState.mode === 'work' && timerState.remaining === 0)
    || timerState.roundComplete;
  if (getDragon(state.dragonId) && blockInPlay) render();
  else showTitle();

  function stop() {
    clearInterval(interval);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    window.removeEventListener('storage', onStorage);
    reminders.release();
  }

  return { destroy: stop };
};

// screen manager with a small cache so we can pre-build then show by name
const createScreenManagerWithCache = (root) => {
  const cache = {};
  const mgr = createScreenManager(root, cache);
  let current = null;
  return {
    set: (name, el) => { cache[name] = el; },
    show: (name) => { current = name; mgr.show(name); },
    get: (name) => cache[name],
    get current() { return current; },
  };
};
