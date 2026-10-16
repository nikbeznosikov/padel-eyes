// Rules come from the FIP Rules of Padel (review of 1 January 2026). Tactics list coaching sources
// where we have them; the rest follow from court geometry and are explained in `explanation`.
//
// Shape of a puzzle (all positions in meters, see js/court.js for the axes):
//   players: start positions of you, partner, opp1, opp2
//   intro: shots played before the question; the first one starts at `from`
//   introMoves / introTags: player runs and event labels during the intro
//   decision: { by, when } stops just before that player's hit, { at } stops at a time,
//             null plays the intro out and asks for a judgement (rules)
//   options: two or three answers; `shots` and `moves` animate what happens next
//   group: "rules", "basics" or "advanced"; lesson: the one line to remember
const FIP_EN = "https://www.padelfip.com/wp-content/uploads/2025/12/FIP_Rules-of-Padel.pdf";
const FIP_ES = "https://www.padelfip.com/wp-content/uploads/2025/12/FIP_Reglas-del-Padel.pdf";
const serveIntoFence = {
  id: "rules-serve-fence",
  group: "rules",
  category: "Rules",
  title: "Serve into the side fence",
  question: "The serve bounces in your box, then hits the side fence. What is the call?",
  side: "right",
  players: {
    you: { x: 3.5, z: -8.0, stance: "back" },
    partner: { x: -2.5, z: -7.6, stance: "back" },
    opp1: { x: -2.5, z: 7.4, stance: "back" },
    opp2: { x: 2.5, z: 3.0, stance: "net" },
  },
  intro: [{ by: "opp1", from: { x: -2.5, y: 0.8, z: 7.4 }, to: { x: 4.2, z: -3.6 }, speed: 15, stroke: "serve" }],
  introTags: [
    { kind: "bounce", text: "Bounce" },
    { kind: "mesh", text: "Fence" },
  ],
  decision: null,
  options: [
    {
      id: "A",
      label: "Good serve, play it",
      correct: false,
      result: "It is not a good serve.",
      shots: [],
    },
    {
      id: "B",
      label: "Let, serve again",
      correct: false,
      result: "It is not a let.",
      shots: [],
    },
    {
      id: "C",
      label: "Fault",
      correct: true,
      result: "Fault. On a second serve, your team wins the point.",
      shots: [],
    },
  ],
  lesson: "Bounce, then glass: good serve. Bounce, then fence: fault.",
  explanation: "A serve that bounces in the box and then touches the metal fence before the second bounce is a fault (FIP Rule 7.1e). On most courts the side fence is the middle part of the side, so this happens on wide serves. If the same serve hits the side glass near the back, it is a good serve and you must play it.",
  wrong: {
    A: "Landing in the box is not enough. If the serve touches the fence before the second bounce, it is a fault.",
    B: "A let needs the serve to touch the net first. Even then, it is a fault if it touches the fence after (FIP Rule 9.1a).",
  },
  sources: [
    {
      title: "FIP Rules of Padel 2026, Rule 7.1(e): the serve is a fault if the ball bounces in the box and",
      url: FIP_EN,
      kind: "quote",
      text: "touches the metallic fence around the court before the second bounce",
      lang: "en",
    },
    {
      title: "FIP Reglas del Pádel 2026, Regla 7.1(e)",
      url: FIP_ES,
      kind: "summary",
      text: "The Spanish original says the same: a serve that bounces in the box and touches the metal mesh before the second bounce is a fault.",
      lang: "es",
    },
    {
      title: "FIP Rules of Padel 2026, Rule 9.1(a)",
      url: FIP_EN,
      kind: "summary",
      text: "A serve that touches the net and lands in the box is a 'net' (served again) only if it does not touch the fence before the second bounce.",
      lang: "en",
    },
  ],
  confidence: "high",
};
const lobDepth = {
  id: "defense-lob-depth",
  group: "basics",
  category: "Defense",
  title: "How deep should your lob go?",
  question: "Both are at the net. You lob. Where should it bounce?",
  side: "right",
  players: {
    you: { x: 3.1, z: -8.6, stance: "back" },
    partner: { x: -2.5, z: -8.0, stance: "back" },
    opp1: { x: -2.3, z: 2.8, stance: "net" },
    opp2: { x: 2.3, z: 2.8, stance: "net" },
  },
  // Their volley bounces about 3 m in front of you and comes up to waist height on your right.
  intro: [{ by: "opp2", from: { x: 2.1, y: 1.1, z: 2.6 }, to: { x: 3.3, z: -5.6 }, apex: 2.4, stroke: "volley" }],
  decision: { by: "you", when: { kind: "afterBounce", height: 1.0 } },
  options: [
    {
      id: "A",
      label: "Short, just over them",
      marker: { x: -0.5, z: 4.8, kind: "target" },
      correct: false,
      result: "The net player takes a step back and smashes it. Point lost.",
      shots: [
        { by: "you", to: { x: -0.5, z: 4.8 }, apex: 5.5, stroke: "lob", tag: "LOB" },
        { by: "opp1", when: { kind: "cross", z: 3.3 }, to: { x: 1.2, z: -4.6 }, speed: 24, stroke: "overhead", tag: "SMASH" },
      ],
    },
    {
      id: "B",
      label: "Deep, past their service line",
      marker: { x: -0.5, z: 8.3, kind: "target" },
      correct: true,
      result: "They run back to play it off the glass. You both take the net.",
      shots: [
        { by: "you", to: { x: -0.5, z: 8.3 }, apex: 6.0, stroke: "lob", tag: "LOB" },
        { by: "opp1", when: { kind: "afterGlass", height: 1.0 }, to: { x: 1.9, z: -5.0 }, apex: 1.7, stroke: "drive" },
        { by: "you", to: { x: -3.6, z: 8.6 }, speed: 14, stroke: "volley" },
      ],
      moves: [
        { who: "opp2", to: { x: 1.8, z: 7.6 }, at: 0.35, speed: 4.5 },
        { who: "you", to: { x: 2.4, z: -3.2 }, at: 0.7, speed: 4.5 },
        { who: "partner", to: { x: -2.4, z: -3.2 }, at: 0.75, speed: 4.5 },
      ],
    },
    {
      id: "C",
      label: "All the way to their glass",
      marker: { x: -0.5, z: 9.6, kind: "target" },
      correct: false,
      result: "It hits their glass before it bounces. Point lost.",
      shots: [{ by: "you", to: { x: -0.5, z: 10 }, wallHeight: 2.0, apex: 5.5, stroke: "lob", tag: "LOB" }],
      eventTags: [{ kind: "glass", text: "Glass, no bounce" }],
    },
  ],
  lesson: "Lob high and deep: past their service line, before their glass.",
  explanation: "A good defensive lob goes high over the net players and bounces past their service line, before their back glass. They cannot smash it well, so they must turn and run back. That gives you and your partner time to move up. A short lob is the easiest ball for a net player to smash.",
  wrong: {
    A: "It lands where the net players can still reach it over their heads, so they smash it.",
    C: "The ball must bounce on their side first. If it hits their glass or fence on the full, you lose the point (FIP Rule 13.1g).",
  },
  sources: [
    {
      title: "LTA Padel: tips to play and improve padel lobs",
      url: "https://ltapadel.org.uk/play/padel-tips-and-techniques/lobs/",
      kind: "summary",
      text: "Depth is the key to a lob: aim for it to bounce just past the service line and before the back glass, so the opponents are pushed back.",
      lang: "en",
    },
    {
      title: "The Padel School: mastering the padel lob",
      url: "https://thepadelschool.com/post/mastering-the-padel-lob",
      kind: "summary",
      text: "A lob that is too low is easy to smash. The practice drill puts target cones past the service line.",
      lang: "en",
    },
    {
      title: "Padel Addict: el globo, el golpe más importante del pádel",
      url: "https://www.padeladdict.com/globo-golpe-mas-importante-padel/",
      kind: "summary",
      text: "Play the lob high and deep, so you are not left exposed.",
      lang: "es",
    },
    {
      title: "Padelstar: consejos para una buena defensa en pádel",
      url: "https://padelstar.es/tactica-padel/consejos-para-una-buena-defensa-en-padel/",
      kind: "summary",
      text: "The lob must be safe: deep enough that the opponent cannot smash it. A short lob makes losing the point much more likely.",
      lang: "es",
    },
    {
      title: "FIP Rules of Padel 2026, Rule 13.1(g)",
      url: FIP_EN,
      kind: "summary",
      text: "You lose the point if your ball hits the opponents' walls or fence before it bounces on their side.",
      lang: "en",
    },
  ],
  confidence: "high",
};
const afterTheLob = {
  id: "positioning-after-lob",
  group: "basics",
  category: "Positioning",
  title: "Your lob went over them. Now what?",
  question: "Your deep lob beats them. They turn and run back. What now?",
  side: "right",
  players: {
    you: { x: 3.0, z: -8.9, stance: "back" },
    partner: { x: -2.5, z: -8.2, stance: "back" },
    opp1: { x: -2.3, z: 2.8, stance: "net" },
    opp2: { x: 2.3, z: 2.8, stance: "net" },
  },
  intro: [{ by: "you", from: { x: 3.2, y: 0.85, z: -9.2 }, to: { x: -0.5, z: 8.3 }, apex: 6.0, stroke: "lob", tag: "LOB" }],
  introMoves: [
    { who: "opp1", to: { x: -1.4, z: 6.8 }, at: 0.55, speed: 4.2 },
    { who: "opp2", to: { x: 1.9, z: 6.6 }, at: 0.6, speed: 4.2 },
  ],
  decision: { at: 1.55 },
  options: [
    {
      id: "A",
      label: "Stay at the back and wait",
      correct: false,
      result: "They play it back and walk back to the net. Your good lob is wasted.",
      shots: [{ by: "opp1", when: { kind: "afterGlass", height: 1.0 }, to: { x: 0.6, z: -7.4 }, apex: 5.0, stroke: "lob" }],
      moves: [
        { who: "opp2", to: { x: 2.3, z: 2.8 }, at: 1.9, speed: 4 },
        { who: "opp1", to: { x: -2.3, z: 2.8 }, at: 2.4, speed: 4 },
      ],
    },
    {
      id: "B",
      label: "Both move up to the net together",
      correct: true,
      result: "You both hold the net. They have to defend from the back.",
      shots: [
        { by: "opp1", when: { kind: "afterGlass", height: 1.0 }, to: { x: 1.9, z: -5.0 }, apex: 1.7, stroke: "drive" },
        { by: "you", to: { x: -3.6, z: 8.6 }, speed: 14, stroke: "volley" },
      ],
      moves: [
        { who: "you", to: { x: 2.4, z: -3.2 }, at: 0, speed: 4.5 },
        { who: "partner", to: { x: -2.4, z: -3.2 }, at: 0.05, speed: 4.5 },
      ],
    },
    {
      id: "C",
      label: "Only you run to the net",
      correct: false,
      result: "A big gap opens between you and your partner. They hit the ball through it.",
      shots: [{ by: "opp1", when: { kind: "afterGlass", height: 1.0 }, to: { x: -0.3, z: -5.6 }, speed: 11, stroke: "drive" }],
      moves: [
        { who: "you", to: { x: 2.4, z: -3.2 }, at: 0, speed: 4.5 },
        { who: "partner", to: { x: -1.6, z: -7.2 }, at: 2.2, speed: 3.5 },
      ],
    },
  ],
  lesson: "Your lob gets past them? Both of you go to the net, together.",
  explanation: "A lob that goes over the opponents is your chance to take the net, and the team at the net usually controls the point. Start moving as soon as you see them turn. Move with your partner, side by side, like one block. If the lob is short and does not push them back, stay at the back instead.",
  wrong: {
    A: "You do not use the time your lob gave you, and they get the net back for free.",
    C: "With one player at the net and one at the back, a big hole opens on the diagonal for them to hit into.",
  },
  sources: [
    {
      title: "Padel Addict: subir a la red, ¿cuándo debemos hacerlo?",
      url: "https://www.padeladdict.com/cuando-subir-red-padel/",
      kind: "summary",
      text: "If your lob gets past the opponent, it is time to go to the net. If it is short and does not push them back, stay back.",
      lang: "es",
    },
    {
      title: "Padelstar: subir a la red en pádel, ¿cuándo y para qué?",
      url: "https://padelstar.es/tactica-padel/subir-la-red-en-padel-para-que/",
      kind: "summary",
      text: "Move forward to the net after a lob that is deep enough to pass the opponents. If it is not deep enough, do not take the risk.",
      lang: "es",
    },
    {
      title: "The Padel School: the three most common padel tactics errors",
      url: "https://thepadelschool.com/padel-tips/the-three-most-common-padel-tactics-errors",
      kind: "summary",
      text: "You play as a pair: if your partner goes back, you go back; if your partner goes to the net, you go too.",
      lang: "en",
    },
    {
      title: "The Padel School: moving as a pair",
      url: "https://thepadelschool.com/padel-tips/moving-as-a-pair",
      kind: "summary",
      text: "If one of you stays back, a huge gap opens on the diagonal in the middle of the court. Moving together leaves only small gaps.",
      lang: "en",
    },
    {
      title: "Muñoz Marín et al. (2017), Retos 31: actions to take the net in padel",
      url: "https://revistaretos.org/index.php/retos/article/view/48988",
      kind: "summary",
      text: "In 416 moves from the back to the net in World Padel Tour and regional finals, 60.6% came after a lob, and lob approaches kept the point alive more often (65.9% vs 47.0%).",
      lang: "es",
    },
  ],
  confidence: "high",
};
const FFT_GUIDE = "https://www.irbms.com/wp-content/uploads/2023/03/padel-guide-pratique-ff-tennis.pdf";

const kneeBallToGlass = {
  id: "defense-let-it-pass",
  group: "basics",
  category: "Defense",
  title: "Low ball at your knees near the back glass",
  question: "Their volley bounces behind your service line and comes at your knees. What do you do?",
  side: "right",
  players: {
    you: { x: 2.3, z: -8.7, stance: "back" },
    partner: { x: -2.5, z: -8.7, stance: "back" },
    opp1: { x: -2.0, z: 3.0, stance: "net" },
    opp2: { x: 2.0, z: 3.0, stance: "net" },
  },
  // Bounces behind your service line, reaches you at knee height, hits the glass on the way up
  // and comes back out at about 1 m: the normal case, not the very low ball that dies at the glass.
  intro: [{ by: "opp2", from: { x: 2.0, y: 1.0, z: 3.0 }, to: { x: 2.4, z: -7.9 }, apex: 2.5, stroke: "volley" }],
  introTags: [{ kind: "bounce", text: "Behind the service line" }],
  // Stop just before the bounce, while you can still see where it lands.
  decision: { at: 1.1 },
  options: [
    {
      id: "A",
      label: "Hit it now, before the glass",
      correct: false,
      result: "The ball pops up and the net player volleys it away.",
      shots: [
        { by: "you", when: { kind: "cross", z: -8.5 }, to: { x: 2.1, z: 4.6 }, apex: 2.1, stroke: "drive" },
        { by: "opp2", when: { kind: "cross" }, to: { x: 0.2, z: -5.0 }, speed: 14, stroke: "volley" },
      ],
    },
    {
      id: "B",
      label: "Pick it up right after the bounce",
      correct: false,
      result: "You lift the ball, and the next volley lands at your feet.",
      shots: [
        { by: "you", when: { kind: "onRise", height: 0.2 }, to: { x: 1.5, z: 4.4 }, apex: 2.3, stroke: "drive" },
        { by: "opp2", when: { kind: "cross" }, to: { x: 2.6, z: -6.2 }, speed: 15, stroke: "volley" },
      ],
    },
    {
      id: "C",
      label: "Let it go to the glass, then play it",
      correct: true,
      result: "Off the glass it comes up to a good height. You lob them, and you both move up.",
      shots: [{ by: "you", when: { kind: "afterGlass", height: 0.9 }, to: { x: -1.5, z: 8.3 }, apex: 6.0, stroke: "lob", tag: "LOB" }],
      moves: [
        { who: "opp1", to: { x: -1.8, z: 7.6 }, at: 1.2, speed: 4.5 },
        { who: "opp2", to: { x: 1.8, z: 7.8 }, at: 1.25, speed: 4.5 },
        { who: "you", to: { x: 2.4, z: -3.2 }, at: 1.5, speed: 4.5 },
        { who: "partner", to: { x: -2.4, z: -3.2 }, at: 1.55, speed: 4.5 },
      ],
      eventTags: [{ kind: "glass", text: "Glass" }],
    },
  ],
  lesson: "Bounce past your service line? Let the glass give you time.",
  explanation:
    "The ball bounced behind your service line, so let it pass and play it after the glass. The glass slows it down and gives you time to turn and meet it in front of you at a good height. Take it before the glass only if it is very low, very slow or has a lot of backspin, or if the glass is wet: then it can die at the glass.",
  wrong: {
    A: "A low ball at your knees is hard to hit well, and it often floats up for an easy volley.",
    B: "Picking the ball up right after the bounce is a very hard shot from the back, and it usually goes up to the net player.",
  },
  sources: [
    {
      title: "French Tennis Federation (FFT): Padel guide pratique, strategy section",
      url: FFT_GUIDE,
      kind: "summary",
      text: "In most cases, a ball that bounces behind the service line should be played after it comes off the glass.",
      lang: "fr",
    },
    {
      title: "LTA Padel: skills for beginners",
      url: "https://www.ltapadel.org.uk/play/how-to-get-started-playing-padel/skills-for-beginners",
      kind: "summary",
      text: "Practice using the back glass for every incoming ball that bounces on or past the service line.",
      lang: "en",
    },
    {
      title: "Padel Magazine: avant ou après la vitre ?",
      url: "https://padelmagazine.fr/avant-ou-apres-la-vitre/",
      kind: "summary",
      text: "If the ball bounces behind the service line, let it pass, unless it is very low or very slow, because then it comes off the glass too low.",
      lang: "fr",
    },
    {
      title: "Padel Addict: ¿cuándo debemos usar las paredes durante un partido de pádel?",
      url: "https://www.padeladdict.com/cuando-usar-las-paredes-durante-un-partido-de-padel/",
      kind: "summary",
      text: "A deep ball with a lot of spin dies at the glass, so take it early. On very humid days, letting the ball reach the glass is risky.",
      lang: "es",
    },
  ],
  confidence: "high",
};

const deepLobBandeja = {
  id: "net-deep-lob-bandeja",
  group: "advanced",
  category: "Net play",
  title: "Deep lob over you at the net",
  question: "You are at the net. Their lob is deep, but with a few steps back you can still reach it in the air. What do you play?",
  side: "right",
  players: {
    you: { x: 2.5, z: -3.0, stance: "net" },
    partner: { x: -2.5, z: -3.0, stance: "net" },
    opp1: { x: -2.5, z: 8.6, stance: "back" },
    opp2: { x: 2.5, z: 8.6, stance: "back" },
  },
  intro: [{ by: "opp1", from: { x: -2.5, y: 0.8, z: 8.6 }, to: { x: 3.0, z: -8.3 }, apex: 5.5, stroke: "lob", tag: "LOB" }],
  decision: { at: 0.6 },
  options: [
    {
      id: "A",
      label: "Smash it hard",
      correct: false,
      result: "It comes off their glass at an easy height, and they hit the next ball at your feet while you are still deep.",
      shots: [
        { by: "you", when: { kind: "cross", z: -6.3 }, to: { x: -2.0, z: 5.5 }, speed: 24, stroke: "overhead", tag: "SMASH" },
        { by: "opp1", when: { kind: "afterGlass", height: 1.2 }, to: { x: 1.8, z: -5.4 }, apex: 1.5, stroke: "drive" },
      ],
    },
    {
      id: "B",
      label: "Play a bandeja and move back up",
      correct: true,
      result: "They must defend a low ball from the corner, and you are both back at the net.",
      shots: [
        { by: "you", when: { kind: "cross", z: -6.3 }, to: { x: -3.3, z: 7.5 }, speed: 13, stroke: "overhead", tag: "BANDEJA" },
        { by: "opp1", when: { kind: "afterGlass", height: 0.6 }, to: { x: 0.6, z: -4.6 }, apex: 1.8, stroke: "drive" },
      ],
      moves: [{ who: "you", to: { x: 2.5, z: -3.2 }, at: 1.25, speed: 4.5 }],
    },
    {
      id: "C",
      label: "Let it bounce and play it off the glass",
      correct: false,
      result: "They take your place at the net, and now you defend from the back.",
      shots: [
        { by: "you", when: { kind: "afterGlass", height: 1.0 }, to: { x: 0.0, z: 5.6 }, apex: 4.5, stroke: "lob" },
        { by: "opp2", when: { kind: "cross", z: 3.4 }, to: { x: 1.5, z: -6.5 }, speed: 20, stroke: "overhead" },
      ],
      moves: [
        { who: "partner", to: { x: -2.5, z: -8.2 }, at: 0.6, speed: 4 },
        { who: "opp1", to: { x: -2.3, z: 3.0 }, at: 1.0, speed: 4 },
        { who: "opp2", to: { x: 2.3, z: 3.0 }, at: 1.0, speed: 4 },
      ],
    },
  ],
  lesson: "Deep lob: bandeja to keep the net. Smash the short ones.",
  explanation:
    "The lob is deep, but you can still hit it in front of you. Answer a deep lob with a bandeja: a controlled overhead at medium pace, so you and your partner keep the net. Smash only short lobs, when you are close to the net and well placed. Let a lob pass only when it gets behind you and you cannot hit it in front.",
  wrong: {
    A: "A hard smash from deep while moving back gives them a high ball off their glass.",
    C: "You could reach the ball, so letting it bounce gives away the net for nothing.",
  },
  sources: [
    {
      title: "Padel Addict: ¿bandeja o remate? (tips from Carolina Navarro and Ceci Reiter)",
      url: "https://www.padeladdict.com/bandeja-o-remate/",
      kind: "summary",
      text: "If the lob is long, defend your place at the net with a bandeja at medium pace. If the lob is short, smash.",
      lang: "es",
    },
    {
      title: "Padel Magazine: bandeja, víbora et smash au padel",
      url: "https://padelmagazine.fr/bandeja-vibora-et-smash-au-padel/",
      kind: "summary",
      text: "The bandeja is a waiting shot to take the net back after a fairly deep lob, hit before the bounce at low speed into the back of their court.",
      lang: "fr",
    },
    {
      title: "LTA Padel: overheads, the bandeja and the smash",
      url: "https://www.ltapadel.org.uk/play/padel-tips-and-techniques/overheads-bandeja-and-the-smash/",
      kind: "summary",
      text: "The bandeja is the most common overhead and the answer to the lob: a defensive shot to keep your place at the net.",
      lang: "en",
    },
    {
      title: "Padel Magazine: acceptez de vous faire lober au padel !",
      url: "https://padelmagazine.fr/acceptez-de-vous-faire-lober-au-padel/",
      kind: "summary",
      text: "In your comfort zone, play a smash or bandeja. Only when the lob reaches your discomfort zone, let it pass and rebuild from the back.",
      lang: "fr",
    },
  ],
  confidence: "high",
};

const ownBackGlass = {
  id: "rules-own-back-glass",
  group: "rules",
  category: "Rules",
  title: "Using your own back glass",
  question: "The ball passes you. You hit it into your own back wall so it flies over the net. Which one is legal?",
  side: "right",
  // You turn to face your own glass, so the view may turn all the way round.
  turnAround: true,
  players: {
    you: { x: 2.2, z: -7.3, stance: "back" },
    partner: { x: -2.5, z: -8.0, stance: "back" },
    opp1: { x: -2.0, z: 3.0, stance: "net" },
    opp2: { x: 2.0, z: 3.0, stance: "net" },
  },
  intro: [{ by: "opp2", from: { x: 2.0, y: 1.1, z: 3.0 }, to: { x: 3.0, z: -5.0 }, apex: 2.4, stroke: "volley" }],
  decision: { by: "you", when: { kind: "afterBounce", height: 0.9 } },
  // Launch velocities found by search from the contact point (3.35, 0.9, -7.82).
  options: [
    {
      id: "A",
      label: "Into your glass, then it bounces in their court",
      correct: true,
      result: "Legal. The ball is in play and they must return it.",
      shots: [
        { by: "you", to: { x: 0.6, z: 5.1 }, velocity: { x: -2, y: 11.25, z: -17.5 }, stroke: "drive" },
        { by: "opp2", when: { kind: "afterBounce", height: 1.0 }, to: { x: 1.0, z: -6.0 }, apex: 2.5, stroke: "drive" },
      ],
      eventTags: [
        { kind: "glass", text: "Your glass" },
        { kind: "bounce", text: "Bounce: good" },
      ],
    },
    {
      id: "B",
      label: "Into the metal fence above your glass",
      correct: false,
      result: "Point lost as soon as the ball touches your own fence.",
      shots: [{ by: "you", to: { x: 3.35, z: -10 }, velocity: { x: 0, y: 13.25, z: -10 }, stroke: "drive" }],
      eventTags: [{ kind: "mesh", text: "Your fence: point lost" }],
    },
    {
      id: "C",
      label: "Off your glass, straight onto their glass",
      correct: false,
      result: "Point lost: the ball did not bounce in their court before it hit their wall.",
      shots: [{ by: "you", to: { x: 0, z: 10 }, velocity: { x: -2.5, y: 14.5, z: -23 }, stroke: "drive" }],
      eventTags: [
        { kind: "glass", text: "Your glass" },
        { kind: "glass", nth: 2, text: "Their glass, no bounce" },
      ],
    },
  ],
  lesson: "Your own glass is fine. Your own fence loses the point.",
  explanation:
    "FIP Rule 14.1b: a return is good if it hits a wall on your own side first and then bounces in the other court. So you may use your own glass. On the back wall only the first 3 m are glass; the top 1 m is fence. And the ball must still bounce in their court before it touches their glass or fence.",
  wrong: {
    B: "Your own glass is allowed, but your own metal fence is not (FIP Rule 13.1l).",
    C: "After your own wall, the ball must still bounce in their court first (FIP Rule 13.1g).",
  },
  sources: [
    {
      title: "FIP Rules of Padel 2026, Rule 14.1(b): a return is correct if the ball",
      url: FIP_EN,
      kind: "quote",
      text: "hits the wall in the players own court first",
      lang: "en",
    },
    {
      title: "FIP Rules of Padel 2026, Rules 13.1(l) and 13.1(g)",
      url: FIP_EN,
      kind: "summary",
      text: "You lose the point if your ball touches the metal fence on your own side, or if it hits their walls or fence before bouncing in their court.",
      lang: "en",
    },
    {
      title: "FIP Reglas del Pádel 2026, Regla 14.1(b)",
      url: FIP_ES,
      kind: "summary",
      text: "The Spanish original says the same: the ball may hit one of your own walls first and then bounce in the other court.",
      lang: "es",
    },
    {
      title: "French Tennis Federation (FFT): Padel guide pratique, principles of play",
      url: FFT_GUIDE,
      kind: "summary",
      text: "You may only use the glass on your own side to send the ball back. If it touches your fence and then goes over, it is a fault.",
      lang: "fr",
    },
  ],
  confidence: "high",
};

const PADEL_BROWSER_COVERAGE = "https://www.padelbrowser.com/blog/padel-positioning-court-coverage-guide";
const PADEL_BROWSER_SMASH = "https://www.padelbrowser.com/blog/how-to-defend-the-smash-in-padel";
const TPS_PAIR = "https://thepadelschool.com/padel-tips/moving-as-a-pair";
const TPS_RETURN = "https://thepadelschool.com/post/the-perfect-padel-return";
const PA_CHIQUITA = "https://www.padeladdict.com/como-y-cuando-hacer-chiquita-padel/";

const serveToNet = {
  id: "basics-serve-net",
  group: "basics",
  category: "Serve",
  title: "You just served. Now what?",
  question: "You just served. Where do you go?",
  side: "right",
  players: {
    you: { x: 2.2, z: -7.7, stance: "back" },
    partner: { x: -2.4, z: -3.0, stance: "net" },
    opp1: { x: -2.8, z: 8.6, stance: "back" },
    opp2: { x: 2.6, z: 8.4, stance: "back" },
  },
  intro: [{ by: "you", from: { x: 2.2, y: 0.8, z: -7.7 }, to: { x: -2.4, z: 5.9 }, apex: 1.55, stroke: "serve" }],
  decision: { at: 0.45 },
  options: [
    {
      id: "A",
      label: "Stay at the back",
      correct: false,
      result: "They return and walk up to the net. Now they attack.",
      shots: [
        { by: "opp1", when: { kind: "afterBounce", height: 0.9 }, to: { x: 1.8, z: -4.9 }, apex: 1.25, stroke: "drive" },
        { by: "you", when: { kind: "afterBounce", height: 0.6 }, to: { x: 0.5, z: 3.6 }, apex: 2.4, stroke: "drive" },
        { by: "opp1", when: { kind: "cross", z: 3.0 }, to: { x: 1.0, z: -7.6 }, speed: 16, stroke: "volley" },
      ],
      moves: [
        { who: "opp1", to: { x: -2.2, z: 3.0 }, at: 0.75, speed: 4.5 },
        { who: "opp2", to: { x: 2.2, z: 3.0 }, at: 0.85, speed: 4.5 },
      ],
    },
    {
      id: "B",
      label: "Follow your serve to the net",
      correct: true,
      result: "You reach the net in time. Your volleys keep them at the back.",
      shots: [
        { by: "opp1", when: { kind: "afterBounce", height: 0.9 }, to: { x: 1.6, z: -5.2 }, apex: 1.6, stroke: "drive" },
        { by: "you", when: { kind: "cross", z: -3.4 }, to: { x: 0.6, z: 7.8 }, speed: 12, stroke: "volley" },
        { by: "opp2", when: { kind: "afterBounce", height: 0.8 }, to: { x: 1.4, z: -5.0 }, apex: 2.1, stroke: "drive" },
        { by: "you", when: { kind: "cross", z: -2.9 }, to: { x: -4.1, z: 3.3 }, speed: 12, stroke: "volley" },
      ],
      moves: [{ who: "you", to: { x: 2.0, z: -3.4 }, at: 0, speed: 4.6 }],
    },
    {
      id: "C",
      label: "Run in, stop at the service line",
      correct: false,
      result: "The return dips at your feet. Your half-volley goes into the net.",
      shots: [
        { by: "opp1", when: { kind: "afterBounce", height: 0.9 }, to: { x: 1.8, z: -5.4 }, apex: 1.25, stroke: "drive" },
        { by: "you", when: { kind: "onRise", height: 0.35 }, to: { x: 0.8, z: 2.2 }, apex: 0.9, stroke: "volley" },
      ],
      moves: [{ who: "you", to: { x: 2.0, z: -6.4 }, at: 0, speed: 4.5 }],
    },
  ],
  lesson: "The serve is your way to the net. Go all the way in.",
  explanation:
    "The team at the net wins most points, and the serve is your best chance to get there. After you serve, move up to a spot at the net where you cover your side and the middle. Do not stop halfway: there the ball comes at your feet, and you can only lift it.",
  wrong: {
    A: "You give the net to them for free.",
    C: "Halfway in, you are too far to volley well and too close to let the ball bounce.",
  },
  sources: [
    {
      title: "LTA Padel: how to serve in padel. The most important thing about the serve is that it",
      url: "https://www.ltapadel.org.uk/play/padel-tips-and-techniques/serve/",
      kind: "quote",
      text: "sets you up to try and get to the net",
      lang: "en",
    },
    {
      title: "French Tennis Federation (FFT): Padel guide pratique, strategy section",
      url: FFT_GUIDE,
      kind: "summary",
      text: "Try to take the net as a team, as early as possible.",
      lang: "fr",
    },
    {
      title: "Padel Browser: padel positioning, the complete court coverage guide",
      url: PADEL_BROWSER_COVERAGE,
      kind: "summary",
      text: "Between the service line and the net is no man's land. You cross it to get to the net, but never stand in it while an opponent is hitting.",
      lang: "en",
    },
  ],
  confidence: "high",
};

const smashDefense = {
  id: "defense-smash-glass",
  group: "basics",
  category: "Defense",
  title: "They are about to smash",
  question: "Your lob was short. Their net player will smash it hard. Where do you wait?",
  side: "right",
  players: {
    you: { x: 2.5, z: -8.4, stance: "back" },
    partner: { x: -2.5, z: -8.4, stance: "back" },
    opp1: { x: -2.2, z: 3.0, stance: "net" },
    opp2: { x: 2.0, z: 3.0, stance: "net" },
  },
  intro: [{ by: "partner", from: { x: -2.5, y: 0.8, z: -8.4 }, to: { x: 1.8, z: 5.8 }, apex: 4.8, stroke: "lob", tag: "SHORT LOB" }],
  decision: { at: 1.2 },
  options: [
    {
      id: "A",
      label: "Back against your glass",
      correct: false,
      result: "It comes off the glass fast and flies past you.",
      shots: [{ by: "opp2", when: { kind: "cross", z: 3.4 }, to: { x: 2.4, z: -5.6 }, speed: 22, stroke: "overhead", tag: "SMASH" }],
      moves: [{ who: "you", to: { x: 2.4, z: -9.6 }, at: 0, speed: 3 }],
    },
    {
      id: "B",
      label: "A few steps in front of the glass",
      correct: true,
      result: "It comes off the glass to you, and you have time for a deep lob.",
      shots: [
        { by: "opp2", when: { kind: "cross", z: 3.4 }, to: { x: 2.4, z: -5.6 }, speed: 22, stroke: "overhead", tag: "SMASH" },
        { by: "you", when: { kind: "afterGlass", height: 1.0 }, to: { x: -1.0, z: 8.4 }, apex: 6.0, stroke: "lob", tag: "LOB" },
      ],
      moves: [{ who: "you", to: { x: 2.5, z: -7.4 }, at: 0, speed: 3 }],
      eventTags: [{ kind: "glass", text: "Glass" }],
    },
    {
      id: "C",
      label: "Halfway to the net",
      correct: false,
      result: "It reaches you low and fast. You pop it up, and they smash again.",
      shots: [
        { by: "opp2", when: { kind: "cross", z: 3.4 }, to: { x: 2.3, z: -3.6 }, speed: 22, stroke: "overhead", tag: "SMASH" },
        { by: "you", when: { kind: "onRise", height: 0.75 }, to: { x: 0.2, z: 2.4 }, apex: 4.2, stroke: "volley" },
        { by: "opp1", when: { kind: "cross", z: 1.3 }, to: { x: -4.0, z: -4.4 }, speed: 20, stroke: "overhead" },
      ],
      moves: [{ who: "you", to: { x: 2.4, z: -5.5 }, at: 0, speed: 4.5 }],
    },
  ],
  lesson: "Against a hard smash, keep room behind you and go forward with the rebound.",
  explanation:
    "A hard smash bounces and comes off your back glass fast. With your back on the glass you have no room to swing, and the ball flies past you. Wait a few steps in front of the glass, then move forward and play the ball after it comes off the glass. Halfway to the net is too close: the smash reaches you before you can react.",
  wrong: {
    A: "Against the glass you have no room to swing at the rebound.",
    C: "So close, the smash reaches you at full speed.",
  },
  sources: [
    {
      title: "French Tennis Federation (FFT): Padel guide pratique, strategy section",
      url: FFT_GUIDE,
      kind: "summary",
      text: "If you think the opponent will smash hard, unlike in tennis, move forward toward the net to take the ball after it comes off the glass.",
      lang: "fr",
    },
    {
      title: "Padel Browser: how to defend the smash in padel",
      url: PADEL_BROWSER_SMASH,
      kind: "quote",
      text: "Stand a step off the glass, not against it.",
      lang: "en",
    },
    {
      title: "LTA Padel: how to play off the back glass in padel",
      url: "https://www.ltapadel.org.uk/play/padel-tips-and-techniques/how-to-play-off-the-back-glass-in-padel/",
      kind: "summary",
      text: "The back glass helps you defend powerful shots like a smash. Read the pace: move close to the glass only for slow balls.",
      lang: "en",
    },
  ],
  confidence: "high",
};

const lowOrLob = {
  id: "defense-low-or-lob",
  group: "basics",
  category: "Defense",
  title: "Lob or keep it low?",
  question: "Their fast volley will come off your glass low, at your knees. Both are at the net. What do you play?",
  side: "right",
  players: {
    you: { x: 2.6, z: -8.2, stance: "back" },
    partner: { x: -2.5, z: -8.2, stance: "back" },
    opp1: { x: -2.2, z: 3.0, stance: "net" },
    opp2: { x: 2.2, z: 3.0, stance: "net" },
  },
  intro: [{ by: "opp2", from: { x: 2.2, y: 1.1, z: 3.0 }, to: { x: 2.9, z: -8.9 }, speed: 16, stroke: "volley" }],
  // Stop while the ball still comes at you, so you see them both at the net.
  decision: { at: 0.7 },
  options: [
    {
      id: "A",
      label: "Lob over them",
      correct: false,
      result: "From that low ball your lob comes out short. They smash it.",
      shots: [
        { by: "you", when: { kind: "afterGlass", height: 0.62 }, to: { x: 0.6, z: 4.6 }, apex: 4.6, stroke: "lob", tag: "SHORT LOB" },
        { by: "opp2", when: { kind: "cross", z: 2.6 }, to: { x: -4.0, z: -3.4 }, speed: 21, stroke: "overhead", tag: "SMASH" },
      ],
    },
    {
      id: "B",
      label: "Keep it low over the net",
      correct: true,
      result: "They must volley up from low. The next ball is easy to lob deep.",
      shots: [
        { by: "you", when: { kind: "afterGlass", height: 0.62 }, to: { x: 0.2, z: 4.0 }, apex: 1.45, stroke: "drive" },
        { by: "opp1", when: { kind: "cross", z: 3.3 }, to: { x: 1.6, z: -6.6 }, apex: 2.4, stroke: "volley" },
        { by: "you", when: { kind: "afterBounce", height: 1.0 }, to: { x: -1.0, z: 8.3 }, apex: 6.0, stroke: "lob", tag: "LOB" },
      ],
    },
    {
      id: "C",
      label: "Hit it hard at the net player",
      correct: false,
      result: "From so low the ball flies up, and he volleys it away.",
      shots: [
        { by: "you", when: { kind: "afterGlass", height: 0.62 }, to: { x: 2.4, z: 7.2 }, speed: 18, stroke: "drive" },
        { by: "opp2", when: { kind: "cross", z: 3.2 }, to: { x: -4.1, z: -3.3 }, speed: 14, stroke: "volley" },
      ],
    },
  ],
  lesson: "Awkward low ball: play it low. Save the lob for a comfortable ball.",
  explanation:
    "When the ball reaches you low or in an awkward spot, a lob is risky: it often comes out short and gives them an easy smash. Play it low over the net instead, so they must volley up from their feet. Lob when the ball comes to you at a comfortable height, for example at mid-height off the back glass.",
  wrong: {
    A: "A lob from a low, awkward ball is often short, and short lobs get smashed.",
    C: "From below the net a hard ball goes up, and that is an easy volley.",
  },
  sources: [
    {
      title: "Padel Addict: ¿cuándo defender con globos y cuándo por abajo? (Carolina Navarro and Ceci Reiter)",
      url: "https://www.padeladdict.com/cuando-defender-con-globos-y-cuando-por-abajo/",
      kind: "summary",
      text: "A low or uncomfortable ball: always play low, never a lob, because the lob may come out short. A comfortable ball, for example at mid-height off the back glass: lob.",
      lang: "es",
    },
    {
      title: "Padelstar: consejos para una buena defensa en pádel",
      url: "https://padelstar.es/tactica-padel/consejos-para-una-buena-defensa-en-padel/",
      kind: "summary",
      text: "When you are not comfortable at the back, play low with no lobs: a volley is harder for them to win with than a smash off a bad lob.",
      lang: "es",
    },
  ],
  confidence: "high",
};

const partnerWide = {
  id: "positioning-partner-wide",
  group: "basics",
  category: "Positioning",
  title: "Partner stuck in the corner",
  question: "Their volley pulls your partner into the far corner. Where do you go?",
  side: "right",
  players: {
    you: { x: 2.5, z: -8.2, stance: "back" },
    partner: { x: -2.5, z: -8.2, stance: "back" },
    opp1: { x: -2.2, z: 3.0, stance: "net" },
    opp2: { x: 2.2, z: 3.0, stance: "net" },
  },
  intro: [{ by: "opp2", from: { x: 2.2, y: 1.1, z: 3.0 }, to: { x: -4.0, z: -7.4 }, speed: 14, stroke: "volley" }],
  introMoves: [{ who: "partner", to: { x: -3.9, z: -8.9 }, at: 0.15, speed: 4 }],
  decision: { at: 0.75 },
  options: [
    {
      id: "A",
      label: "Stay on your side",
      correct: false,
      result: "A big hole opens in the middle. Their volley goes through it.",
      shots: [
        { by: "partner", when: { kind: "afterGlass", height: 0.8 }, to: { x: 0.6, z: 5.8 }, apex: 2.4, stroke: "drive" },
        { by: "opp2", when: { kind: "cross", z: 3.4 }, to: { x: -0.6, z: -5.4 }, speed: 16, stroke: "volley" },
      ],
    },
    {
      id: "B",
      label: "Move toward the middle",
      correct: true,
      result: "Their volley to the middle comes to you, and you lob deep.",
      shots: [
        { by: "partner", when: { kind: "afterGlass", height: 0.8 }, to: { x: 0.6, z: 5.8 }, apex: 2.4, stroke: "drive" },
        { by: "opp2", when: { kind: "cross", z: 3.4 }, to: { x: -0.6, z: -5.4 }, speed: 16, stroke: "volley" },
        { by: "you", when: { kind: "afterBounce", height: 1.0 }, to: { x: -0.8, z: 8.3 }, apex: 6.0, stroke: "lob", tag: "LOB" },
      ],
      moves: [{ who: "you", to: { x: 0.3, z: -7.6 }, at: 0, speed: 4 }],
    },
    {
      id: "C",
      label: "Go across to help your partner",
      correct: false,
      result: "Your side is empty now, and their volley goes there.",
      shots: [
        { by: "partner", when: { kind: "afterGlass", height: 0.8 }, to: { x: 0.6, z: 5.8 }, apex: 2.4, stroke: "drive" },
        { by: "opp2", when: { kind: "cross", z: 3.4 }, to: { x: 3.9, z: -5.4 }, speed: 15, stroke: "volley" },
      ],
      moves: [{ who: "you", to: { x: -1.6, z: -8.4 }, at: 0, speed: 4 }],
    },
  ],
  lesson: "Your partner is pulled wide? You close the middle.",
  explanation:
    "When one player is stuck on the side, the partner moves toward the centre of the court. That covers the easy volley down the middle and leaves them only a hard shot. Move as if a rope joins you to your partner. Going to the same side as your partner leaves your own side empty.",
  wrong: {
    A: "With one of you stuck wide, the middle is the easiest place for them to hit.",
    C: "Two players on one side leave the other side empty.",
  },
  sources: [
    {
      title: "The Padel School: moving as a pair (lateral movements)",
      url: TPS_PAIR,
      kind: "summary",
      text: "When your partner is stuck on the side, you move to the centre to cover the simple volley down the middle. Otherwise the court is wide open.",
      lang: "en",
    },
    {
      title: "Padel Browser: padel positioning. If your partner gets dragged wide for a ball,",
      url: PADEL_BROWSER_COVERAGE,
      kind: "quote",
      text: "you slide toward the middle to close the gap",
      lang: "en",
    },
  ],
  confidence: "high",
};

const chiquita = {
  id: "attack-chiquita",
  group: "advanced",
  category: "Attack",
  title: "When to play a chiquita",
  question: "They are at the net but stand a bit far back. The ball comes to you at waist height. You want the net. What do you play?",
  side: "right",
  players: {
    you: { x: 2.5, z: -8.0, stance: "back" },
    partner: { x: -2.5, z: -8.0, stance: "back" },
    opp1: { x: -2.3, z: 4.7, stance: "net" },
    opp2: { x: 2.3, z: 4.7, stance: "net" },
  },
  intro: [{ by: "opp2", from: { x: 2.3, y: 1.0, z: 4.7 }, to: { x: 2.5, z: -5.6 }, apex: 1.7, stroke: "volley" }],
  decision: { by: "you", when: { kind: "afterBounce", height: 0.9 } },
  options: [
    {
      id: "A",
      label: "Hard drive at the net player",
      correct: false,
      result: "He uses your pace and volleys it away.",
      shots: [
        { by: "you", to: { x: 2.2, z: 7.2 }, speed: 19, stroke: "drive" },
        { by: "opp2", when: { kind: "cross", z: 4.9 }, to: { x: -4.1, z: -3.4 }, speed: 15, stroke: "volley" },
      ],
    },
    {
      id: "B",
      label: "Soft ball that dips at their feet",
      correct: true,
      result: "He must lift it from his feet. You move up and volley it away.",
      shots: [
        { by: "you", to: { x: 1.4, z: 3.5 }, apex: 1.25, stroke: "drive", tag: "CHIQUITA" },
        { by: "opp2", when: { kind: "cross", z: 4.2 }, to: { x: 1.3, z: -4.8 }, apex: 2.5, stroke: "volley" },
        { by: "you", when: { kind: "cross", z: -3.4 }, to: { x: -4.1, z: 3.0 }, speed: 12, stroke: "volley" },
      ],
      moves: [
        { who: "you", to: { x: 2.2, z: -3.6 }, at: 0.25, speed: 4.5 },
        { who: "partner", to: { x: -2.2, z: -3.6 }, at: 0.3, speed: 4.5 },
      ],
    },
    {
      id: "C",
      label: "Soft ball, high over the net",
      correct: false,
      result: "It floats up at chest height, and he volleys it away.",
      shots: [
        { by: "you", to: { x: 1.8, z: 5.4 }, apex: 2.3, stroke: "drive" },
        { by: "opp2", when: { kind: "cross", z: 3.0 }, to: { x: -4.1, z: -3.2 }, apex: 1.6, stroke: "volley" },
      ],
    },
  ],
  lesson: "They stand far from the net? A slow ball at their feet takes the net from them.",
  explanation:
    "The chiquita is a slow ball that drops just below net height at the opponents' feet. They must lift it, and you move up behind it to take the net. It works best when they stand a little far from the net. It must stay low: a soft ball that floats up is an easy volley.",
  wrong: {
    A: "A fast ball is easy to block for a player at the net.",
    C: "Soft is not enough: it must drop at their feet, below net height.",
  },
  sources: [
    {
      title: "Padel Addict: cómo y cuándo hacer la chiquita",
      url: PA_CHIQUITA,
      kind: "summary",
      text: "Play a slow ball that drops just below net height, so they must lift it from their feet, then move up. A good moment is when the opponents stand a little far from the net. If the ball stays higher than planned, you are at their mercy.",
      lang: "es",
    },
    {
      title: "The Padel School: the perfect padel return",
      url: TPS_RETURN,
      kind: "summary",
      text: "The chiquita is a soft shot down to the feet of your opponents. Placement and control matter more than spin.",
      lang: "en",
    },
    {
      title: "Padel Browser: padel positioning, when to move up",
      url: PADEL_BROWSER_COVERAGE,
      kind: "summary",
      text: "Move up behind shots that buy you time, like a chiquita: a soft, low ball to the net player's feet that forces an upward volley.",
      lang: "en",
    },
  ],
  confidence: "high",
};

const returnRusher = {
  id: "return-server-rushes",
  group: "advanced",
  category: "Return",
  title: "The server rushes in",
  question: "You return. The server sprints in and is already close to the net. What do you play?",
  side: "right",
  players: {
    you: { x: 2.7, z: -8.6, stance: "back" },
    partner: { x: -2.6, z: -8.6, stance: "back" },
    opp1: { x: -2.2, z: 7.6, stance: "back" },
    opp2: { x: 2.4, z: 3.0, stance: "net" },
  },
  intro: [{ by: "opp1", from: { x: -2.2, y: 0.8, z: 7.6 }, to: { x: 2.4, z: -5.6 }, apex: 1.55, stroke: "serve" }],
  introMoves: [{ who: "opp1", to: { x: -1.9, z: 3.2 }, at: 0.15, speed: 5.2 }],
  decision: { by: "you", when: { kind: "afterBounce", height: 0.9 } },
  options: [
    {
      id: "A",
      label: "Soft chiquita to his feet",
      correct: false,
      result: "He is already close, so he volleys it before it drops.",
      shots: [
        { by: "you", to: { x: -1.4, z: 2.6 }, apex: 1.45, stroke: "drive", tag: "CHIQUITA" },
        { by: "opp1", when: { kind: "cross", z: 1.8 }, to: { x: -4.1, z: -3.2 }, apex: 1.35, stroke: "volley" },
      ],
    },
    {
      id: "B",
      label: "High lob over him",
      correct: true,
      result: "He has to turn and run back. You both take the net.",
      shots: [
        { by: "you", to: { x: -1.4, z: 8.4 }, apex: 6.0, stroke: "lob", tag: "LOB" },
        { by: "opp1", when: { kind: "afterGlass", height: 1.0 }, to: { x: 1.6, z: -4.8 }, apex: 1.8, stroke: "drive" },
        { by: "you", when: { kind: "cross", z: -3.4 }, to: { x: -4.1, z: 3.6 }, speed: 12, stroke: "volley" },
      ],
      moves: [
        { who: "opp1", to: { x: -1.6, z: 7.8 }, at: 0.3, speed: 5 },
        { who: "opp2", to: { x: 2.0, z: 7.4 }, at: 0.4, speed: 4.5 },
        { who: "you", to: { x: 2.3, z: -3.4 }, at: 0.6, speed: 4.5 },
        { who: "partner", to: { x: -2.3, z: -3.4 }, at: 0.65, speed: 4.5 },
      ],
    },
    {
      id: "C",
      label: "Hard at the net player",
      correct: false,
      result: "The net player is ready for it and volleys it away.",
      shots: [
        { by: "you", to: { x: 2.4, z: 6.4 }, speed: 18, stroke: "drive" },
        { by: "opp2", when: { kind: "cross", z: 3.1 }, to: { x: 4.0, z: -3.0 }, apex: 1.5, stroke: "volley" },
      ],
    },
  ],
  lesson: "Server already at the net: lob. Server still on the way in: low to his feet.",
  explanation:
    "A soft, low return to the server's feet works while the server is still on the way in. If the server rushes in and is already close to the net, a soft ball is just an easy volley. Then lob high over the server, and move up to the net with your partner.",
  wrong: {
    A: "A chiquita works only while the player is still far from the net.",
    C: "The net player is waiting for a ball in his reach.",
  },
  sources: [
    {
      title: "The Padel School: the perfect padel return. When you find the chiquita difficult to play or",
      url: TPS_RETURN,
      kind: "quote",
      text: "the server comes aggressively to the net, you can play a high lob",
      lang: "en",
    },
    {
      title: "The Padel School: the perfect padel return, common errors",
      url: TPS_RETURN,
      kind: "summary",
      text: "Using the chiquita when the opponents are already close to the net is a common return error.",
      lang: "en",
    },
    {
      title: "Padel Addict: cómo y cuándo hacer la chiquita",
      url: PA_CHIQUITA,
      kind: "summary",
      text: "The chiquita is a good choice when the opponents stand a little far from the net.",
      lang: "es",
    },
  ],
  confidence: "high",
};

const shortLobSmash = {
  id: "net-short-lob-smash",
  group: "advanced",
  category: "Net play",
  title: "Short lob over you at the net",
  question: "You are at the net. Their lob is short: you can hit it high, in front of you. What do you play?",
  side: "right",
  players: {
    you: { x: 2.4, z: -3.0, stance: "net" },
    partner: { x: -2.4, z: -3.0, stance: "net" },
    opp1: { x: -2.4, z: 8.4, stance: "back" },
    opp2: { x: 2.5, z: 8.6, stance: "back" },
  },
  intro: [{ by: "opp1", from: { x: -2.4, y: 0.8, z: 8.4 }, to: { x: 1.9, z: -5.4 }, apex: 4.7, stroke: "lob", tag: "SHORT LOB" }],
  decision: { at: 1.0 },
  options: [
    {
      id: "A",
      label: "Safe bandeja to the corner",
      correct: false,
      result: "They get a comfortable ball off the glass and lob you again.",
      shots: [
        { by: "you", when: { kind: "cross", z: -3.3 }, to: { x: -3.3, z: 7.6 }, speed: 13, stroke: "overhead", tag: "BANDEJA" },
        { by: "opp1", when: { kind: "afterGlass", height: 1.0 }, to: { x: 1.4, z: -7.6 }, apex: 5.8, stroke: "lob", tag: "LOB" },
      ],
    },
    {
      id: "B",
      label: "Smash it hard",
      correct: true,
      result: "It comes off their glass fast and low. They put it into the net.",
      shots: [
        { by: "you", when: { kind: "cross", z: -3.3 }, to: { x: 0.3, z: 5.6 }, speed: 24, stroke: "overhead", tag: "SMASH" },
        { by: "opp1", when: { kind: "afterGlass", height: 0.6 }, to: { x: 0.6, z: -3.0 }, apex: 0.95, stroke: "drive", passNet: true },
      ],
    },
    {
      id: "C",
      label: "Let it bounce",
      correct: false,
      result: "They come to the net, and now you defend from the back.",
      shots: [
        { by: "you", when: { kind: "afterBounce", height: 1.0 }, to: { x: -0.4, z: 6.0 }, apex: 4.2, stroke: "lob" },
        { by: "opp2", when: { kind: "cross", z: 4.0 }, to: { x: -4.0, z: -3.4 }, speed: 20, stroke: "overhead" },
      ],
      moves: [
        { who: "opp1", to: { x: -2.3, z: 3.2 }, at: 0.5, speed: 4.5 },
        { who: "opp2", to: { x: 2.3, z: 3.2 }, at: 0.5, speed: 4.5 },
      ],
    },
  ],
  lesson: "Short lob: smash to finish. Deep lob: bandeja to keep the net.",
  explanation:
    "A short lob is your chance to finish the point: you are close to the net and the ball is in front of you, so smash it. Keep the bandeja for deep lobs, when you must move back and hit behind your head. Letting a short lob bounce gives away the net for nothing.",
  wrong: {
    A: "A bandeja keeps the point going. On a short lob you can end it.",
    C: "You could hit it in the air, so letting it bounce gives away the net.",
  },
  sources: [
    {
      title: "Padel Addict: ¿bandeja o remate? (tips from Carolina Navarro and Ceci Reiter)",
      url: "https://www.padeladdict.com/bandeja-o-remate/",
      kind: "summary",
      text: "If the lob is long, keep the net with a bandeja at medium pace. If you force a short lob, smash to try to win the point.",
      lang: "es",
    },
    {
      title: "LTA Padel: overheads, the bandeja and the smash",
      url: "https://www.ltapadel.org.uk/play/padel-tips-and-techniques/overheads-bandeja-and-the-smash/",
      kind: "summary",
      text: "The smash is aggressive and made to finish points quickly; play it close to the net. The bandeja is controlled and defensive.",
      lang: "en",
    },
    {
      title: "Padel Browser: how to defend the smash in padel",
      url: PADEL_BROWSER_SMASH,
      kind: "quote",
      text: "A short lob is an invitation.",
      lang: "en",
    },
  ],
  confidence: "high",
};

const netLine = {
  id: "net-cover-line",
  group: "advanced",
  category: "Net play",
  title: "Who covers the line?",
  question: "You are both at the net. You volley deep down the line, to the player in front of you. Where do you stand now?",
  side: "right",
  players: {
    you: { x: 2.0, z: -3.2, stance: "net" },
    partner: { x: -2.4, z: -3.2, stance: "net" },
    opp1: { x: -2.4, z: 8.4, stance: "back" },
    opp2: { x: 2.4, z: 8.2, stance: "back" },
  },
  intro: [{ by: "you", from: { x: 2.0, y: 1.1, z: -3.2 }, to: { x: 3.8, z: 7.4 }, speed: 12, stroke: "volley" }],
  introMoves: [{ who: "opp2", to: { x: 3.6, z: 8.8 }, at: 0.1, speed: 4 }],
  decision: { at: 1.05 },
  options: [
    {
      id: "A",
      label: "Move to the middle",
      correct: false,
      result: "Your line is open, and he drives the ball down it.",
      shots: [{ by: "opp2", when: { kind: "afterBounce", height: 0.9 }, to: { x: 4.3, z: -5.6 }, apex: 1.35, stroke: "drive" }],
      moves: [{ who: "you", to: { x: 0.6, z: -3.2 }, at: 0, speed: 3 }],
    },
    {
      id: "B",
      label: "Cover your line, partner takes the middle",
      correct: true,
      result: "His drive down the line comes to you. You finish with a drop volley.",
      shots: [
        { by: "opp2", when: { kind: "afterBounce", height: 0.9 }, to: { x: 4.3, z: -5.6 }, apex: 1.35, stroke: "drive" },
        { by: "you", when: { kind: "cross", z: -3.0 }, to: { x: -2.2, z: 1.6 }, apex: 1.45, stroke: "volley", tag: "DROP VOLLEY" },
      ],
      moves: [
        { who: "you", to: { x: 3.0, z: -3.0 }, at: 0, speed: 3 },
        { who: "partner", to: { x: -0.6, z: -3.2 }, at: 0, speed: 3 },
      ],
    },
    {
      id: "C",
      label: "Both stay wide, one on each side",
      correct: false,
      result: "The middle is open, and he drives the ball through it.",
      shots: [{ by: "opp2", when: { kind: "afterBounce", height: 0.9 }, to: { x: 0.2, z: -5.2 }, apex: 1.4, stroke: "drive" }],
      moves: [{ who: "you", to: { x: 3.0, z: -3.0 }, at: 0, speed: 3 }],
    },
  ],
  lesson: "Ball on your side: you take the line, your partner closes the middle.",
  explanation:
    "At the net, both players shift toward the side where the ball is. The player on that side covers the line, and the partner covers the middle. That leaves them only the cross-court angle, the hardest shot to make. If you leave your line, or if you both stay wide, you open an easy gap.",
  wrong: {
    A: "Leaving your line opens the easiest shot, straight down the side.",
    C: "With both of you wide, the middle is open.",
  },
  sources: [
    {
      title: "Padel Browser: padel positioning. When the ball is on the right,",
      url: PADEL_BROWSER_COVERAGE,
      kind: "quote",
      text: "the right-side player covers the line and the left-side player covers the middle",
      lang: "en",
    },
    {
      title: "The Padel School: moving as a pair (at the net)",
      url: TPS_PAIR,
      kind: "summary",
      text: "After your volley down the line you cover that line. Your partner comes across to cover the centre instead of leaving a huge hole in the middle.",
      lang: "en",
    },
    {
      title: "Padel Addict: colocación en la volea (Manu Martín)",
      url: "https://www.padeladdict.com/colocacion-en-la-volea/",
      kind: "summary",
      text: "As a basic rule, the player diagonal to the hitter covers the centre of the court.",
      lang: "es",
    },
  ],
  confidence: "high",
};

const netHeight = {
  id: "basics-net-height",
  group: "basics",
  category: "Consistency",
  title: "Where is the net lowest?",
  question: "You hit a low, flat ball. Where is it safest to pass the net?",
  side: "right",
  players: {
    you: { x: 2.6, z: -8.6, stance: "back" },
    partner: { x: -2.6, z: -8.6, stance: "back" },
    opp1: { x: -2.4, z: 8.4, stance: "back" },
    opp2: { x: 2.4, z: 8.4, stance: "back" },
  },
  intro: [{ by: "opp2", from: { x: 2.4, y: 0.9, z: 8.4 }, to: { x: 3.0, z: -5.0 }, apex: 1.8, stroke: "drive" }],
  decision: { by: "you", when: { kind: "afterBounce", height: 0.85 } },
  // Both shots cross the net 0.93 m high: over the middle that clears, by the side post it does not.
  options: [
    {
      id: "A",
      label: "Down the line, by the side wall",
      marker: { x: 4.5, z: 0.4, kind: "target" },
      correct: false,
      result: "The net is higher at the sides. Your ball clips the net.",
      shots: [{ by: "you", to: { x: 4.6, z: 2.5 }, velocity: { x: 2.594, y: 3.584, z: 14.774 }, stroke: "drive" }],
    },
    {
      id: "B",
      label: "Over the middle",
      marker: { x: 0.7, z: 0.4, kind: "target" },
      correct: true,
      result: "It clears the lowest part of the net and dips at their feet.",
      shots: [{ by: "you", to: { x: 0.1, z: 2.4 }, velocity: { x: -4.197, y: 3.669, z: 14.401 }, stroke: "drive", stopAfter: 1.3 }],
    },
    {
      id: "C",
      label: "Anywhere, the net is the same height",
      correct: false,
      result: "It is not. The net is higher at the sides, and your ball hits the net.",
      shots: [{ by: "you", to: { x: 4.6, z: 2.5 }, velocity: { x: 2.594, y: 3.584, z: 14.774 }, stroke: "drive" }],
    },
  ],
  lesson: "The net is lowest in the middle: 88 cm, against 92 cm at the sides.",
  explanation:
    "By the rules the net is 0.88 m high in the middle and 0.92 m at the ends. With a low ball, those 4 cm decide if it goes over. When you are not sure, pass the net through the middle.",
  wrong: {
    A: "By the side wall the net is 4 cm higher.",
    C: "The net sags: it is 4 cm lower in the middle than at the sides.",
  },
  sources: [
    {
      title: "FIP Rules of Padel 2026, the net: it must be 10 meters long and",
      url: FIP_EN,
      kind: "quote",
      text: "0.88 high at the center, rising to 0.92 meters at the ends",
      lang: "en",
    },
  ],
};

const lobApex = {
  id: "basics-lob-apex",
  group: "basics",
  category: "Defense",
  title: "Where should your lob peak?",
  question: "Both are at the net. You lob from the back. Where should the ball be at its highest?",
  side: "right",
  players: {
    you: { x: 3.1, z: -8.6, stance: "back" },
    partner: { x: -2.5, z: -8.0, stance: "back" },
    opp1: { x: -2.3, z: 2.8, stance: "net" },
    opp2: { x: 2.3, z: 2.8, stance: "net" },
  },
  intro: [{ by: "opp2", from: { x: 2.1, y: 1.1, z: 2.6 }, to: { x: 3.3, z: -5.6 }, apex: 2.4, stroke: "volley" }],
  decision: { by: "you", when: { kind: "afterBounce", height: 1.0 } },
  options: [
    {
      id: "A",
      label: "Above their net players",
      correct: false,
      result: "It flies too far and hits their back wall before it bounces. Point lost.",
      shots: [{ by: "you", to: { x: -0.5, z: 10 }, wallHeight: 3.3, apex: 6.3, stroke: "lob", tag: "TOP" }],
    },
    {
      id: "B",
      label: "Around the net",
      correct: true,
      result: "It comes down past their service line, and they must run back.",
      shots: [{ by: "you", to: { x: -0.5, z: 8.3 }, apex: 6.0, stroke: "lob", tag: "TOP", stopAfter: 2.9 }],
      moves: [
        { who: "opp1", to: { x: -1.4, z: 7.0 }, at: 0.5, speed: 4.5 },
        { who: "opp2", to: { x: 1.8, z: 7.4 }, at: 0.4, speed: 4.5 },
        { who: "you", to: { x: 2.4, z: -4.0 }, at: 0.8, speed: 4.5 },
        { who: "partner", to: { x: -2.4, z: -4.0 }, at: 0.85, speed: 4.5 },
      ],
    },
    {
      id: "C",
      label: "Well before the net, on your side",
      correct: false,
      result: "It comes down short, and they smash it.",
      shots: [
        { by: "you", to: { x: -0.5, z: 2.4 }, apex: 6.0, stroke: "lob", tag: "TOP" },
        { by: "opp1", when: { kind: "cross", z: 1.2 }, to: { x: -4.0, z: -3.4 }, speed: 21, stroke: "overhead", tag: "SMASH" },
      ],
    },
  ],
  lesson: "A lob from the back is at its highest around the net.",
  explanation:
    "A lob is an arch. From your back court to their back court, the top of that arch is around the net. If the top is above their net players, the ball flies past their court. If the top is on your side, it comes down short, where they can smash it.",
  wrong: {
    A: "With the top that far forward, the ball lands behind their court.",
    C: "With the top on your side, the ball comes down short.",
  },
  sources: [],
};

const SERVE_FROM = { x: 2.2, y: 0.8, z: -7.7 };
const FIRST_SERVE_INTO_NET = { x: -5.224, y: 3.091, z: 15.123 };

const secondServe = {
  id: "basics-second-serve",
  group: "basics",
  category: "Serve",
  title: "Your second serve",
  question: "Your first serve went into the net. How do you play the second one?",
  side: "right",
  players: {
    you: { x: 2.2, z: -7.7, stance: "back" },
    partner: { x: -2.4, z: -3.0, stance: "net" },
    opp1: { x: -2.8, z: 8.6, stance: "back" },
    opp2: { x: 2.4, z: 8.4, stance: "back" },
  },
  intro: [{ by: "you", from: SERVE_FROM, to: { x: -2.4, z: 5.6 }, velocity: FIRST_SERVE_INTO_NET, stroke: "serve", passNet: true }],
  introTags: [{ kind: "net", text: "Fault" }],
  decision: { at: 1.5 },
  options: [
    {
      id: "A",
      label: "The same hard, flat serve",
      correct: false,
      result: "Into the net again: double fault, point lost.",
      shots: [{ by: "you", restart: true, from: SERVE_FROM, to: { x: -2.4, z: 5.6 }, velocity: FIRST_SERVE_INTO_NET, stroke: "serve" }],
      eventTags: [{ kind: "net", text: "Double fault" }],
    },
    {
      id: "B",
      label: "Slower, higher over the net, deep",
      correct: true,
      result: "It goes in with room to spare, and the point starts.",
      shots: [
        { by: "you", restart: true, from: SERVE_FROM, to: { x: -2.2, z: 6.3 }, apex: 1.95, stroke: "serve" },
        { by: "opp1", when: { kind: "afterGlass", height: 0.9 }, to: { x: 1.4, z: -4.9 }, apex: 1.7, stroke: "drive", stopAfter: 0.7 },
      ],
      moves: [{ who: "you", to: { x: 2.0, z: -4.2 }, at: 1.2, speed: 4.5 }],
    },
    {
      id: "C",
      label: "Very soft and short, just to get it in",
      correct: false,
      result: "It sits up short. The returner steps in and attacks it.",
      shots: [
        { by: "you", restart: true, from: SERVE_FROM, to: { x: -1.6, z: 2.4 }, apex: 1.5, stroke: "serve" },
        { by: "opp1", when: { kind: "afterBounce", height: 1.0 }, to: { x: 2.0, z: -6.4 }, speed: 18, stroke: "drive" },
      ],
    },
  ],
  lesson: "Second serve: less speed, more height over the net, and still deep.",
  explanation:
    "A double fault gives away the point with no rally at all. On the second serve, take the risk out: hit it slower and a little higher over the net, so it clears easily, and still aim deep in the box. A very short, soft serve is not safe either: it gives the returner an easy ball to attack.",
  wrong: {
    A: "The same risky serve can miss again, and a second miss loses the point.",
    C: "A short, slow serve is an easy ball for the returner.",
  },
  sources: [],
};

const shortBandeja = {
  id: "defense-short-bandeja",
  group: "basics",
  category: "Defense",
  title: "Slow bandeja in front of you",
  question: "Their slow bandeja will bounce before your service line. You are at the back. What do you do?",
  side: "right",
  players: {
    you: { x: 2.4, z: -8.6, stance: "back" },
    partner: { x: -2.5, z: -8.4, stance: "back" },
    opp1: { x: -2.3, z: 3.2, stance: "net" },
    opp2: { x: 2.2, z: 4.6, stance: "net" },
  },
  intro: [{ by: "opp2", from: { x: 2.0, y: 2.6, z: 4.6 }, to: { x: 2.6, z: -5.4 }, speed: 10, stroke: "overhead", tag: "BANDEJA" }],
  decision: { at: 0.75 },
  options: [
    {
      id: "A",
      label: "Wait and play it off the glass",
      correct: false,
      result: "It barely reaches the glass and dies there. Point lost.",
      shots: [],
      eventTags: [{ kind: "glass", text: "Too low to play" }],
    },
    {
      id: "B",
      label: "Step in and take it before the glass",
      correct: true,
      result: "You get to it in time and keep it low over the net.",
      shots: [{ by: "you", when: { kind: "onRise", height: 0.6 }, to: { x: 0.2, z: 4.2 }, apex: 1.45, stroke: "drive", stopAfter: 1.2 }],
      moves: [{ who: "you", to: { x: 2.6, z: -7.2 }, at: 0, speed: 4 }],
    },
  ],
  lesson: "Slow ball bounces before your service line? Go forward to it.",
  explanation:
    "A slow ball that bounces before your service line has little speed left. It reaches the glass low and dies there, or it does not reach the glass at all. Move forward and play it after the bounce. Wait for the glass when the ball bounces past your service line with some pace.",
  wrong: {
    A: "A slow, short ball dies at the glass. There is nothing to play.",
  },
  sources: [
    {
      title: "Padel Magazine: avant ou après la vitre ?",
      url: "https://padelmagazine.fr/avant-ou-apres-la-vitre/",
      kind: "summary",
      text: "Let a ball that bounces behind the service line pass to the glass, unless it is very low or very slow: then the rebound off the glass is too low to play well.",
      lang: "fr",
    },
  ],
};

const partnerReturnsMiddle = {
  id: "positioning-return-middle",
  group: "basics",
  category: "Positioning",
  title: "Serve to the middle: where do you stand?",
  question: "They serve to the middle, and your partner returns it from there. Where do you stand?",
  side: "right",
  players: {
    you: { x: 0.6, z: -7.0, stance: "back" },
    partner: { x: -2.4, z: -8.6, stance: "back" },
    opp1: { x: -2.3, z: 3.0, stance: "net" },
    opp2: { x: 1.9, z: 7.8, stance: "back" },
  },
  intro: [{ by: "opp2", from: { x: 1.9, y: 0.8, z: 7.8 }, to: { x: -0.4, z: -6.4 }, apex: 1.55, stroke: "serve", tag: "SERVE TO THE MIDDLE" }],
  introMoves: [{ who: "partner", to: { x: -1.2, z: -8.6 }, at: 0.2, speed: 3.5 }],
  decision: { at: 0.95 },
  options: [
    {
      id: "A",
      label: "Stay in the middle, near your partner",
      correct: false,
      result: "Your corner is empty, and their net player volleys straight into it.",
      shots: [
        { by: "partner", when: { kind: "afterBounce", height: 0.85 }, to: { x: 0.4, z: 5.8 }, apex: 1.7, stroke: "drive" },
        { by: "opp1", when: { kind: "cross", z: 2.8 }, to: { x: 3.4, z: -6.6 }, speed: 15, stroke: "volley" },
      ],
    },
    {
      id: "B",
      label: "Go back and cover your corner",
      correct: true,
      result: "Their volley into your corner comes right to you.",
      shots: [
        { by: "partner", when: { kind: "afterBounce", height: 0.85 }, to: { x: 0.4, z: 5.8 }, apex: 1.7, stroke: "drive" },
        { by: "opp1", when: { kind: "cross", z: 2.8 }, to: { x: 3.4, z: -6.6 }, speed: 15, stroke: "volley" },
        { by: "you", when: { kind: "onRise", height: 0.5 }, to: { x: 0.2, z: 4.2 }, apex: 1.5, stroke: "drive", stopAfter: 1.2 },
      ],
      moves: [{ who: "you", to: { x: 2.7, z: -8.6 }, at: 0, speed: 3.5 }],
    },
  ],
  lesson: "Your partner takes the middle ball? You keep your corner covered.",
  explanation:
    "When the serve goes to the middle, your partner moves there to return it. If you move to the middle too, your whole side is empty, and their net player can volley into your corner. Stay back on your side, so the space they aim at is covered.",
  wrong: {
    A: "Two players in the middle leave a corner empty.",
  },
  sources: [],
};

const chiquitaLine = {
  id: "attack-chiquita-line",
  group: "advanced",
  category: "Attack",
  title: "Chiquita: down the line or cross?",
  question: "Both are at the net. You want to play a chiquita at their feet. Which one is easier to play well?",
  side: "right",
  players: {
    you: { x: 2.5, z: -8.0, stance: "back" },
    partner: { x: -2.5, z: -8.0, stance: "back" },
    opp1: { x: -2.3, z: 3.2, stance: "net" },
    opp2: { x: 2.3, z: 3.2, stance: "net" },
  },
  intro: [{ by: "opp2", from: { x: 2.3, y: 1.0, z: 3.2 }, to: { x: 2.5, z: -5.8 }, apex: 1.7, stroke: "volley" }],
  decision: { by: "you", when: { kind: "afterBounce", height: 0.9 } },
  options: [
    {
      id: "A",
      label: "Down the line, to the player in front of you",
      marker: { x: 2.3, z: 2.2, kind: "target" },
      correct: true,
      result: "It is short and easy to control. He lifts it, and you volley it away.",
      shots: [
        { by: "you", to: { x: 2.3, z: 2.2 }, apex: 1.55, stroke: "drive", tag: "CHIQUITA" },
        { by: "opp2", when: { kind: "cross", z: 2.7 }, to: { x: 1.4, z: -4.6 }, apex: 2.5, stroke: "volley" },
        { by: "you", when: { kind: "cross", z: -3.4 }, to: { x: -4.1, z: 3.0 }, speed: 12, stroke: "volley" },
      ],
      moves: [
        { who: "you", to: { x: 2.2, z: -3.6 }, at: 0.25, speed: 4.5 },
        { who: "partner", to: { x: -2.2, z: -3.6 }, at: 0.3, speed: 4.5 },
      ],
    },
    {
      id: "B",
      label: "Crosscourt, to the far player",
      marker: { x: -2.2, z: 3.3, kind: "target" },
      correct: false,
      result: "The long flight gives him time. He steps in and volleys it away.",
      shots: [
        { by: "you", to: { x: -2.2, z: 3.3 }, apex: 1.55, stroke: "drive", tag: "CHIQUITA" },
        { by: "opp1", when: { kind: "cross", z: 1.3 }, to: { x: 4.1, z: -3.2 }, apex: 1.5, stroke: "volley" },
      ],
      moves: [
        { who: "you", to: { x: 2.2, z: -4.6 }, at: 0.25, speed: 4.5 },
        { who: "partner", to: { x: -2.2, z: -4.6 }, at: 0.3, speed: 4.5 },
      ],
    },
  ],
  lesson: "Chiquita: the short way, down the line, is easier to control.",
  explanation:
    "A chiquita down the line travels the shortest distance, so its length is easier to control and there is less room for a mistake. Crosscourt the ball travels much farther: it is harder to land at their feet, and the far player has more time to step in and volley it.",
  wrong: {
    B: "A longer flight is harder to control and gives him more time.",
  },
  sources: [],
};

const chiquitaLength = {
  id: "attack-chiquita-length",
  group: "advanced",
  category: "Attack",
  title: "Chiquita: miss short or long?",
  question: "You go for a chiquita, but it may not come out perfect. Which miss is better?",
  side: "right",
  players: {
    you: { x: 2.5, z: -8.0, stance: "back" },
    partner: { x: -2.5, z: -8.0, stance: "back" },
    opp1: { x: -2.3, z: 3.2, stance: "net" },
    opp2: { x: 2.3, z: 3.2, stance: "net" },
  },
  intro: [{ by: "opp2", from: { x: 2.3, y: 1.0, z: 3.2 }, to: { x: 2.5, z: -5.8 }, apex: 1.7, stroke: "volley" }],
  decision: { by: "you", when: { kind: "afterBounce", height: 0.9 } },
  options: [
    {
      id: "A",
      label: "A bit short, in front of their feet",
      marker: { x: 2.3, z: 1.7, kind: "target" },
      correct: true,
      result: "It bounces before him. He must lift it from the ground, and you volley it away.",
      shots: [
        { by: "you", to: { x: 2.3, z: 1.7 }, apex: 1.7, stroke: "drive", tag: "CHIQUITA" },
        { by: "opp2", when: { kind: "cross", z: 2.7 }, to: { x: 1.4, z: -4.6 }, apex: 2.5, stroke: "volley" },
        { by: "you", when: { kind: "cross", z: -3.4 }, to: { x: -4.1, z: 3.0 }, speed: 12, stroke: "volley" },
      ],
      moves: [
        { who: "you", to: { x: 2.2, z: -3.6 }, at: 0.25, speed: 4.5 },
        { who: "partner", to: { x: -2.2, z: -3.6 }, at: 0.3, speed: 4.5 },
      ],
    },
    {
      id: "B",
      label: "A bit long, past their feet",
      marker: { x: 2.3, z: 4.8, kind: "target" },
      correct: false,
      result: "It reaches him above the net, and he volleys it away.",
      shots: [
        { by: "you", to: { x: 2.3, z: 4.8 }, apex: 1.95, stroke: "drive", tag: "CHIQUITA" },
        { by: "opp2", when: { kind: "cross", z: 3.0 }, to: { x: -4.1, z: -3.2 }, apex: 1.5, stroke: "volley" },
      ],
      moves: [
        { who: "you", to: { x: 2.2, z: -4.6 }, at: 0.25, speed: 4.5 },
        { who: "partner", to: { x: -2.2, z: -4.6 }, at: 0.3, speed: 4.5 },
      ],
    },
  ],
  lesson: "A chiquita must make them hit up. A short one still does, a long one does not.",
  explanation:
    "The chiquita works because they must hit the ball up from below the net. A ball that lands a little short still does that: they have to dig it up after the bounce. A ball that goes a little long reaches them at net height or above, and that is an easy volley.",
  wrong: {
    B: "Long, the ball meets his racket above the net. That is an easy volley.",
  },
  sources: [],
};

const readCrosscourt = {
  id: "attack-they-read-cross",
  group: "advanced",
  category: "Attack",
  title: "They read your crosscourt",
  question: "All your balls went crosscourt. Now the player in front of you moves to the middle to cut them off. Where do you play?",
  side: "right",
  players: {
    you: { x: 2.6, z: -8.4, stance: "back" },
    partner: { x: -2.6, z: -8.4, stance: "back" },
    opp1: { x: -2.4, z: 3.2, stance: "net" },
    opp2: { x: 2.4, z: 3.2, stance: "net" },
  },
  intro: [{ by: "opp1", from: { x: -2.4, y: 1.0, z: 3.2 }, to: { x: 2.8, z: -6.0 }, apex: 1.8, stroke: "volley" }],
  introMoves: [{ who: "opp2", to: { x: 0.7, z: 3.0 }, at: 0.35, speed: 3 }],
  decision: { by: "you", when: { kind: "afterBounce", height: 0.9 } },
  options: [
    {
      id: "A",
      label: "Crosscourt again",
      marker: { x: -1.4, z: 5.6, kind: "target" },
      correct: false,
      result: "He was waiting for it and volleys it away.",
      shots: [
        { by: "you", to: { x: -1.4, z: 5.6 }, apex: 1.5, stroke: "drive" },
        { by: "opp2", when: { kind: "cross", z: 2.9 }, to: { x: 4.1, z: -3.2 }, apex: 1.5, stroke: "volley" },
      ],
    },
    {
      id: "B",
      label: "Down the line, past him",
      marker: { x: 4.2, z: 6.4, kind: "target" },
      correct: true,
      result: "He left his line open, so you pass him.",
      shots: [{ by: "you", to: { x: 4.2, z: 6.4 }, apex: 1.4, stroke: "drive", tag: "DOWN THE LINE" }],
    },
  ],
  lesson: "The net player leaves his line to cut the middle? Go down the line.",
  explanation:
    "Crosscourt is usually the safer choice, so good net players move toward the middle to take it. When the player in front of you leaves his line, the space down the line is open. Watch him before you hit, and play into the space he left.",
  wrong: {
    A: "He moved there to take exactly that ball.",
  },
  sources: [],
};

// In play order: rules, then basics, then advanced.
export const PUZZLES = [
  serveIntoFence,
  ownBackGlass,
  serveToNet,
  secondServe,
  netHeight,
  lobDepth,
  lobApex,
  afterTheLob,
  kneeBallToGlass,
  shortBandeja,
  lowOrLob,
  smashDefense,
  partnerWide,
  partnerReturnsMiddle,
  chiquita,
  chiquitaLine,
  chiquitaLength,
  returnRusher,
  readCrosscourt,
  deepLobBandeja,
  shortLobSmash,
  netLine,
];
