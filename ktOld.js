const fs = require("fs"); //Kestron-Tron Main
const fetch = require("node-fetch");
const download = require("image-downloader");
const { JSDOM } = require("jsdom");
var kaProgramRegex =/\b(?!<)https?:\/\/(?:www\.)?khanacademy\.org\/(?:cs|computer-programming)\/[a-z,\d,-]+\/\d{1,16}(?!>)\b/gi;
var discordMessageRegex =/\b(?!<)https?:\/\/(ptb\.|canary\.)?discord(app)?.com\/channels\/(\@me|\d{1,25})\/\d{1,25}\d{1,25}(?!>)\b/gi;
const cleverbot = require("cleverbot-free");
var ml = require("ml-sentiment")();
const axios = require("axios");
const translate = require("translate");
const LanguageDetect = require("languagedetect");
const detect = new LanguageDetect();
let queue = [];
let doing = false;
let checker = null;
async function bustThroughQueue() {
    if (doing) {
        return;
    }
    doing = true;
    let daller = await fetch("https://backend.craiyon.com/generate", {
        headers: {
            accept: "application/json",
            "accept-language": "en-US,en;q=0.9",
            "content-type": "application/json",
            "sec-ch-ua":
                '"Microsoft Edge";v="107", "Chromium";v="107", "Not=A?Brand";v="24"',
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": '"Windows"',
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site",
        },
        referrerPolicy: "same-origin",
        body: '{"prompt":"' + queue[0].prompt + '"}',
        method: "POST",
        mode: "cors",
        credentials: "omit",
    });
    let dalle = await daller.json();
    let fils = [];
    for (var i = 0; i < dalle.images.length; i++) {
        let buffer = Buffer.from(dalle.images[i], "base64");
        fs.writeFileSync(`image-${i}.jpg`, buffer);
        fils.push("image-" + i + ".jpg");
    }
    queue[0].inter.editReply({
        content:
            "<@" +
            queue[0].authorId +
            ">, your request is finished. Credit to <https://www.craiyon.com>.",
        files: fils,
    });
    doing = false;
    try {
        client.users.cache
            .get(queue[0].authorId)
            .send(
                "Your `/dall-e` request finished." +
                    (queue[0].inter.channel
                        ? "\nhttps://discord.com/channels/" +
                          queue[0].inter.guild.id +
                          "/" +
                          queue[0].inter.channel.id +
                          "/" +
                          queue[0].inter.id
                        : "")
            );
    } catch (e) {}
    queue.splice(0, 1);
    dalle = null;
    fils = null;
    if (queue.length === 0) {
        clearInterval(checker);
    } else {
        bustThroughQueue();
    }
}

let store = require("./store.js").datum; //Reaction Roles
let emotes = [];
let peep = "";
let role,
    guild,
    member,
    u = 0;

let cData = require("./cData.js").guildInfo; //Counting
function cDataUpdate() {
    fs.writeFileSync(
        "./cData.js",
        "exports.guildInfo=" + JSON.stringify(cData)
    );
}

let prefix = "="; //Goomba Squad
let goomStorage = require("./goomData.json");
function goomSave() {
    fs.writeFileSync("./goomData.json", JSON.stringify(storage));
}
let possibleCards = [
    {
        name: "Captain Goomba",
        url: "https://mario.wiki.gallery/images/a/a2/Captain_Goomba.png",
        desc: "The go-to soldiers among Bowser's Minions. They move fast and charge into foes!",
        type: "Melee",
        special: "Rocket Headbutt",
        criticals: [""],
    },
    {
        name: "Goomba",
        url: "https://mario.wiki.gallery/images/1/14/MLSSBMGoomba.png",
        desc: "The go-to soldiers among Bowser's Minions. They move fast and charge into foes!",
        type: "Melee",
        special: "Rocket Headbutt",
        criticals: [""],
    },
    {
        name: "Paragoomba",
        url: "https://mario.wiki.gallery/images/0/0d/MLSSBMParagoomba.png",
        desc: "Goombas who soar the sky with grace. With a spin they can do a Cranium Crush.",
        type: "Flying",
        special: "Cranium Crush",
        criticals: [""],
    },
    {
        name: "Big Tail Goomba",
        url: "https://mario.wiki.gallery/images/f/f1/MLSSBMBigTailGoomba.png",
        desc: "Bulky blokes with high POW and HP. They can sweep up foes by spinning their tails.",
        type: "Melee",
        special: "",
        criticals: [""],
    },
    {
        name: "Goomba Tower",
        url: "https://mario.wiki.gallery/images/e/ed/MLSSBMGoombaTower.png",
        desc: "They can use Whomping Wallop to attack all foes in front of them. Weak against Boomerang Bros.",
        type: "Melee",
        special: "Whomping Whallop",
        criticals: [""],
    },
    {
        name: "Captain Koopa Troopa",
        url: "https://mario.wiki.gallery/images/0/02/MLSSBMCaptainKoopa.png",
        desc: "They look innocent, but their shells provide a tough defense. Dry Bones may share their bone structure, but beware-they know their weakness!",
        type: "Melee",
        special: "Rock Solid",
        criticals: [""],
    },
    {
        name: "Koopa Paratroopa",
        url: "https://mario.wiki.gallery/images/7/74/MLSSBMKoopaParatroopaGreen.png",
        desc: "A harmony of heavy shell and light wings. They spin around in the air and attack their enemies from above.",
        type: "Flying",
        special: "Cranium Crush",
        criticals: [""],
    },
    {
        name: "Koopa Paratroopa (Red)",
        url: "https://mario.wiki.gallery/images/a/aa/MLSSBMKoopaParatroopaRed.png",
        desc: "A harmony of heavy shell and light wings. Strong against Spear Guys and other spear-wielding enemies.",
        type: "Flying",
        special: "Cranium Crush",
        criticals: ["Spear Guy", "Chuck Guy", "Elite Chuck Guy"],
    },
    {
        name: "Dry Bones",
        url: "https://mario.wiki.gallery/images/8/84/MLSSBMDryBones.png",
        desc: "Their calcium-deficient bodies are weak. They despise losing to Koopa Troopas.",
        type: "Ranged",
        special: "Chain Shot",
        criticals: [""],
    },
    {
        name: "Captain Boo",
        url: "https://mario.wiki.gallery/images/c/c3/MLSSBMCaptainBoo.png",
        desc: "For Bowser's sake, they won't be frightened! No, really! Prone to mocking their foes and attacking from above.",
        type: "Flying",
        special: "Evasion Cloak",
        criticals: [""],
    },
    {
        name: "Boo",
        url: "https://mario.wiki.gallery/images/3/3b/MLSSBMBoo.png",
        desc: "For Bowser's sake, they won't be frightened! No, really! Prone to mocking their foes and attacking from above.",
        type: "Flying",
        special: "Evasion Cloak",
        criticals: [""],
    },
    {
        name: "Bomb Boo",
        url: "https://mario.wiki.gallery/images/3/3f/MLSSBMBombBoo.png",
        desc: "A rare type of Boo that explodes! They are especially strong against Ice Snifits.",
        type: "Flying",
        special: "Kaboom Bash",
        criticals: ["Ice Snifit"],
    },
    {
        name: "Tail Boo",
        url: "https://mario.wiki.gallery/images/f/f7/MLSSBMTailBoo.png",
        desc: "A rare type of Boo with a tail. Getting hit with said tail really smarts!",
        type: "Flying",
        special: "Spin Cycle",
        criticals: [""],
    },
    {
        name: "Big Boo",
        url: "https://mario.wiki.gallery/images/1/15/MLSSBMBigBoo.png",
        desc: "A big ol' Boo. It's slow, but it flies and has incredible HP and POW.",
        type: "Flying",
        special: "Piercing Projectile",
        criticals: [""],
    },
    {
        name: "Broozer",
        url: "https://mario.wiki.gallery/images/2/2a/MLSSBMBroozer.png",
        desc: "Those deep red gloves are proof of their strength. They especially like to break mechanical things.",
        type: "Melee",
        special: "Air Bash",
        criticals: [
            "Mechakoopa",
            "Bob-omb",
            "Mecha-Fawful X",
            "Mecha-Fawful Y",
            "Mecha-Fawful Z",
        ],
    },
    {
        name: "Captain Shy Guy",
        url: "https://mario.wiki.gallery/images/6/6a/MLSSBMCaptainShyGuy.png",
        desc: "You can't beat that poker face. They excel at evasion and pummeling Lakitus and Lakipeas with turnips.",
        type: "Ranged",
        special: "Throw the Fight",
        criticals: ["Lakitu", "Lakipea"],
    },
    {
        name: "Shy Guy",
        url: "https://mario.wiki.gallery/images/2/2e/MLSSBMShyGuy.png",
        desc: "You can't beat that poker face. They excel at evasion and pummeling Lakitus and Lakipeas with turnips.",
        type: "Ranged",
        special: "Throw the Fight",
        criticals: ["Lakitu", "Lakipea"],
    },
    {
        name: "Spear Guy",
        url: "https://mario.wiki.gallery/images/d/d9/MLSSBMSpearGuy.png",
        desc: "They like to throw their special spear and weave about. Especially strong against Pestnuts, but weak against red Koopa Paratroopas.",
        type: "Ranged",
        special: "Rain of Pain",
        criticals: ["Pestnut", "Elite Pestnut"],
    },
    {
        name: "Fly Guy",
        url: "https://mario.wiki.gallery/images/8/88/MLSSBMFlyGuy.png",
        desc: "Shy Guys who fly through the sky. No lie! Some say they know the weakness of the Ice Bros...",
        type: "Flying",
        special: "Mega Tackle",
        criticals: ["Ice Bro"],
    },
    {
        name: "Buzzy Beetle",
        url: "https://mario.wiki.gallery/images/5/53/MLSSBMBuzzyBeetle.png",
        desc: "Their constant movement masks their lack of power. Just who are those mischievous eyes targeting?!",
        type: "Melee",
        special: "Rock Solid",
        criticals: ["Para-Beetle"],
    },
    {
        name: "Para-Beetle",
        url: "https://mario.wiki.gallery/images/6/63/MLSSBMPara-Beetle.png",
        desc: "A veritable flying fortress. Their bodies are protected by a hard shell. Weak against their rivals, the Buzzy Beetles.",
        type: "Flying",
        special: "Dive Attack",
        criticals: [""],
    },
    {
        name: "Hammer Bro",
        url: "https://mario.wiki.gallery/images/1/1d/MLSSBMHammerBro.png",
        desc: "Those Hammers are deadly from a distance. Their Rain of Pain attack is to be feared!",
        type: "Ranged",
        special: "Rain of Pain",
        criticals: [""],
    },
    {
        name: "Fire Bro",
        url: "https://mario.wiki.gallery/images/9/93/MLSSBMFireBro.png",
        desc: "They throw fireballs as well as a Mario Bro! Burning Fuzzbushes and Pokeys is a cinch, but they're weak to Ice Bros.",
        type: "Ranged",
        special: "Rain of Pain",
        criticals: ["Pokey", "Fuzzbush"],
    },
    {
        name: "Ice Bro",
        url: "https://mario.wiki.gallery/images/9/9c/MLSSBMIceBro.png",
        desc: "That chilly ice is especially strong against Fire Bros. They're weak against those expressionless Fly Guys.",
        type: "Ranged",
        special: "Throw the Fight",
        criticals: ["Fire Bro"],
    },
    {
        name: "Boomerang Bro",
        url: "https://mario.wiki.gallery/images/e/e1/MLSSBMBoomerangBro.png",
        desc: "They throw boomerangs with ample gusto. Strong against Pokeys and Goomba Towers.",
        type: "Ranged",
        special: "Piercing Projectile",
        criticals: ["Pokey", "Goomba Tower"],
    },
    {
        name: "Spiny",
        url: "https://mario.wiki.gallery/images/1/10/MLSSBMSpiny.png",
        desc: "They have a hard shell and painful spikes. Though small, their spin attack is mighty! They seem to be weak against Lakitus.",
        type: "Melee",
        special: "Spin to Win",
        criticals: [""],
    },
    {
        name: "Lakitu",
        url: "https://mario.wiki.gallery/images/c/c0/MLSSBMLakitu.png",
        desc: "They hustle about atop a cloud. They're strong against Beanies and Spinies, but their weakness is a Shy Guy's turnip attack.",
        type: "Flying",
        special: "Chain Stomp",
        criticals: ["Spiny", "Sharpea"],
    },
    {
        name: "Pokey",
        url: "https://mario.wiki.gallery/images/0/0c/MLSSBMPokey.png",
        desc: "They may move slowly, but their HP is their pride. Watch out for the spines that cover their bodies! Weak against boomerang wielders.",
        type: "Melee",
        special: "Whomping Whallop",
        criticals: [""],
    },
    {
        name: "Chain Chomp",
        url: "https://mario.wiki.gallery/images/f/fc/MLSSBMChainChomp.png",
        desc: "Unstoppable when they're off their chains. Difficult to control and highly destructive.",
        type: "Melee",
        special: "Charging Champ",
        criticals: [""],
    },
    {
        name: "Chargin' Chuck",
        url: "https://mario.wiki.gallery/images/3/36/MLSSBMChargin%27Chuck.png",
        desc: "That padding makes for high POW and DEF. They tend to go overboard with their brawn and are weak against Mechakoopas.",
        type: "Melee",
        special: "Air Bash",
        criticals: [""],
    },
    {
        name: "Fire Stalking Piranha Plant",
        url: "https://mario.wiki.gallery/images/4/4d/MLSSBMFireStalkingPiranhaPlant.png",
        desc: "They walk about while spitting out powerful flames. Hey, aren't Fuzzbushes and Pokeys flammable?",
        type: "Ranged",
        special: "Spitfire Fury",
        criticals: ["Pokey", "Fuzzbush"],
    },
    {
        name: "Spike",
        url: "https://mario.wiki.gallery/images/f/f0/MLSSBMSpike.png",
        desc: "They spit up and throw Spike Balls at foes. Gross! The larger ones they throw are especially strong.",
        type: "Ranged",
        special: "Throw the Fight",
        criticals: [""],
    },
    {
        name: "Bob-omb",
        url: "https://mario.wiki.gallery/images/f/fb/MLSSBMBobomb.png",
        desc: "They have explosive power upon impact. Handle these Melee troopers with care.",
        type: "Melee",
        special: "Kaboom Bash",
        criticals: [""],
    },
    {
        name: "Mechakoopa",
        url: "https://mario.wiki.gallery/images/c/cd/MLSSBMMechakoopa.png",
        desc: "They use their small bodies to bob and weave about. Especially strong against Chargin' Chucks, but weak against Broozers.",
        type: "Melee",
        special: "Mega Tackle",
        criticals: ["Chargin' Chuck"],
    },
    {
        name: "Magikoopa (Blue)",
        url: "https://mario.wiki.gallery/images/5/50/MLSSBMMagikoopaBroom.png",
        desc: "Magikoopas dressed in blue. They tear into enemies from atop their brooms.",
        type: "Flying",
        special: "Chain Shot",
        criticals: [""],
    },
    {
        name: "Magikoopa (White)",
        url: "https://mario.wiki.gallery/images/9/96/MLSSBMMagikoopaWhite.png",
        desc: "Magikoopas dressed in white. They use their magic wands to raise a nearby unit's SPEED!",
        type: "Ranged",
        special: "Feed the Speed",
        criticals: [""],
    },
    {
        name: "Magikoopa (Red)",
        url: "https://mario.wiki.gallery/images/e/e2/MLSSBMMagikoopaRed.png",
        desc: "Magikoopas dressed in red. They use their magic wands to raise a nearby unit's POW!",
        type: "Ranged",
        special: "Power Up",
        criticals: [""],
    },
    {
        name: "Magikoopa (Green)",
        url: "https://mario.wiki.gallery/images/7/73/MLSSBMMagikoopaGreen.png",
        desc: "Magikoopas dressed in green. They use their magic wands to raise a nearby unit's ACCURACY!",
        type: "Ranged",
        special: "Sure Shot",
        criticals: [""],
    },
    {
        name: "Sergeant Guy",
        url: "https://mario.wiki.gallery/images/9/9c/MLSSBMSergeantGuy.png",
        desc: "An elite Shy Guy with big dreams. His cowardly nature is great for dodging.",
        type: "Ranged",
        special: "Sure Shot",
        criticals: [""],
    },
    {
        name: "Corporal Paraplonk",
        url: "https://mario.wiki.gallery/images/6/63/MLSSBMCorporalParaplonk.png",
        desc: "An elite Koopa Troopa with big dreams. The bucket on his head gives him a tough defense.",
        type: "Flying",
        special: "Cranium Crush",
        criticals: [""],
    },
    {
        name: "Private Goomp",
        url: "https://mario.wiki.gallery/images/6/64/MLSSBMPrivateGoomp.png",
        desc: "A Goomba with dreams of grandeur. He's quite good at dodging attacks and avoiding being lectured.",
        type: "Melee",
        special: "Rocket Headbutt",
        criticals: [""],
    },
    {
        name: "Prince Peasley",
        url: "https://mario.wiki.gallery/images/6/6f/MLSSBMPrincePeasley.png",
        desc: "The dashing prince of the fair Beanbean Kingdom. Rumored to particularly enjoy conquering Gold Beanies.",
        type: "Flying",
        special: "Charging Champ",
        criticals: ["Gold Beanie"],
    },
    {
        name: "Starlow",
        url: "https://mario.wiki.gallery/images/a/a8/MLSSBMStarlow.png",
        desc: "A Star Sprite with unsurpassed SPEED. Rumored to be especially strong against mechanical baddies.",
        type: "Flying",
        special: "Dive Attack",
        criticals: [
            "Mechakoopa",
            "Bob-omb",
            "Mecha-Fawful X",
            "Mecha-Fawful Y",
            "Mecha-Fawful Z",
        ],
    },
    {
        name: "Bowser Jr",
        url: "https://mario.wiki.gallery/images/d/df/MLSSBMBowserJr.png",
        desc: "King Bowser's only son. Rumored to be especially strong against Magikoopas.",
        type: "Flying",
        special: "Smack-Back Attack",
        criticals: [
            "Magikoopa (Blue)",
            "Magikoopa (Red)",
            "Magikoopa (White)",
            "Magikoopa (Green)",
        ],
    },
    {
        name: "Larry",
        url: "https://mario.wiki.gallery/images/5/5f/MLSSBMLarry.png",
        desc: "One of the seven notorious Koopalings. Has high ACCURACY and is secretly great at sniping.",
        type: "Ranged",
        special: "Throw the Fight",
        criticals: [""],
    },
    {
        name: "Iggy",
        url: "https://mario.wiki.gallery/images/b/b6/MLSSBMIggy.png",
        desc: "One of the seven notorious Koopalings. Powers up characters close to him.",
        type: "Ranged",
        special: "Power Up",
        criticals: [""],
    },
    {
        name: "Wendy",
        url: "https://mario.wiki.gallery/images/3/39/MLSSBMWendy.png",
        desc: "One of the seven notorious Koopalings. You'll pay dearly if you underestimate her power!",
        type: "Ranged",
        special: "Piercing Projectile",
        criticals: [""],
    },
    {
        name: "Morton",
        url: "https://mario.wiki.gallery/images/b/ba/MLSSBMMorton.png",
        desc: "One of the seven notorious Koopalings. Moves slowly, but just one attack can break through rock.",
        type: "Melee",
        special: "Chain Stomp",
        criticals: [""],
    },
    {
        name: "Roy",
        url: "https://mario.wiki.gallery/images/7/7c/MLSSBMRoy.png",
        desc: "One of the seven notorious Koopalings. Quite proud of his incomparably high HP.",
        type: "Melee",
        special: "Spin to Win",
        criticals: [""],
    },
    {
        name: "Lemmy",
        url: "https://mario.wiki.gallery/images/1/18/MLSSBMLemmy.png",
        desc: "One of the seven notorious Koopalings. Has incredibly high EVASION.",
        type: "Ranged",
        special: "Spitfire Fury",
        criticals: [""],
    },
    {
        name: "Ludwig",
        url: "https://mario.wiki.gallery/images/4/44/MLSSBMLudwig.png",
        desc: "One of the seven notorious Koopalings. Has a great balance of POW and DEF.",
        type: "Ranged",
        special: "Chain Shot",
        criticals: [""],
    },
];
let enemyCards = [
    {
        name: "Beanie",
        url: "https://www.mariowiki.com/images/8/8b/MLSSBMBeanie.png",
        desc: "Enemies frequently seen in the Beanbean Kingdom. They move and hop about the battlefield.",
        type: "Melee",
        special: "Mega Tackle",
        criticals: [""],
    },
    {
        name: "Gold Beanie",
        url: "https://www.mariowiki.com/images/a/a7/MLSSBMGoldBeanie.png",
        desc: "Rare Beanies with a gloriously golden glow. Defeat one to win lots of EXP.",
        type: "Melee",
        special: "Mega Tackle",
        criticals: [""],
    },
    {
        name: "Parabeanie",
        url: "https://www.mariowiki.com/images/1/1d/MLSSBMParabeanie.png",
        desc: "Beanies that fly through the air. They soar about the battlefield on small wings.",
        type: "Flying",
        special: "Cranium Crush",
        criticals: [""],
    },
    {
        name: "Troopea",
        url: "https://www.mariowiki.com/images/f/f8/MLSSBMTroopea.png",
        desc: "Foes that strongly resemble Koopa Troopas. Their body is protected by a hard shell.",
        type: "Melee",
        special: "Rock Solid",
        criticals: [""],
    },
    {
        name: "Elite Troopea",
        url: "https://www.mariowiki.com/images/3/3f/MLSSBMEliteTroopea.png",
        desc: "They resemble regular Troopeas but are a bit stronger. They're quite proud of that vibrant color.",
        type: "Melee",
        special: "Rock Solid",
        criticals: [""],
    },
    {
        name: "Paratroopea",
        url: "https://www.mariowiki.com/images/f/fc/MLSSBMParatroopea.png",
        desc: "They strongly resemble Koopa Paratroopas. The leaves on their head are good luck.",
        type: "Flying",
        special: "Cranium Crush",
        criticals: [""],
    },
    {
        name: "Scaratroopea",
        url: "https://www.mariowiki.com/images/2/2a/MLSSBMScaratroopea.png",
        desc: "They strongly resemble Paratroopeas. Full of pride for those bright shells.",
        type: "Flying",
        special: "Cranium Crush",
        criticals: [""],
    },
    {
        name: "Gritty Goomba",
        url: "https://www.mariowiki.com/images/8/8e/MLSSBMGrittyGoomba.png",
        desc: "They resemble Goombas but are...much grittier. Those spears make for powerful headbutts.",
        type: "Melee",
        special: "Rocket Headbutt",
        criticals: [""],
    },
    {
        name: "Tanoomba",
        url: "https://www.mariowiki.com/File:MLSSBMTanoomba.png",
        desc: "They're proud of their POW, despite their small size. Quite speedy, so try to take them down quickly.",
        type: "Melee",
        special: "Spin Cycle",
        criticals: [""],
    },
    {
        name: "Limbo Bro",
        url: "https://www.mariowiki.com/images/0/02/MLSSBMLimboBro.png",
        desc: "Their bodies are much lighter than they appear. They charge headfirst into foes with great power!",
        type: "Melee",
        special: "Smack-Back Attack",
        criticals: [""],
    },
    {
        name: "Elite Limbo Bro",
        url: "https://www.mariowiki.com/images/1/19/MLSSBMEliteLimboBro.png",
        desc: "A more powerful variation of Limbo Bros. Their Smack Back Attack is quite strong.",
        type: "Melee",
        special: "Smack-Back Attack",
        criticals: [""],
    },
    {
        name: "Beanerang Bro",
        url: "https://www.mariowiki.com/images/f/fd/MLSSBMBeanerangBro.png",
        desc: "They look like Boomerang Bros., but more stylish. Their sunglasses kind of make them look evil... Strong against Pokeys and Goomba Towers.",
        type: "Ranged",
        special: "Piercing Projectile",
        criticals: ["Pokey", "Goomba Tower"],
    },
    {
        name: "Ice Snifit",
        url: "https://www.mariowiki.com/images/9/98/MLSSBMIceSnifit.png",
        desc: "Fashion-forward Snifits sporting spiffy coats. They spit out rock-hard snowballs. Ouch! Weak against Bomb Boos.",
        type: "Ranged",
        special: "Spitfire Fury",
        criticals: [""],
    },
    {
        name: "Sharpea",
        url: "https://www.mariowiki.com/images/d/d9/MLSSBMSharpea.png",
        desc: "Foes that strongly resemble Spinies and are weak against Lakitus. Stepping on those spikes hurts A LOT.",
        type: "Melee",
        special: "Spin to Win",
        criticals: [""],
    },
    {
        name: "Lakipea",
        url: "https://www.mariowiki.com/images/2/29/MLSSBMLakipea.png",
        desc: "Though their POW is average, be mindful of their high HP! They hate turnips and the Shy Guys who throw them.",
        type: "Flying",
        special: "Chain Stomp",
        criticals: ["Spiny"],
    },
    {
        name: "Rex",
        url: "https://www.mariowiki.com/images/0/0c/MLSSBMRex.png",
        desc: "Mighty dragons that can't fly, despite having wings. They charge forward when they spot an enemy.",
        type: "Melee",
        special: "Mega Tackle",
        criticals: [""],
    },
    {
        name: "Pestnut",
        url: "https://www.mariowiki.com/images/1/14/MLSSBMPestnut.png",
        desc: "They are completely covered in painful spikes. It hurts no matter where they hit you. Weak against Spear Guys.",
        type: "Melee",
        special: "Spin to Win",
        criticals: [""],
    },
    {
        name: "Elite Pestnut",
        url: "https://www.mariowiki.com/images/9/94/MLSSBMElitePestnut.png",
        desc: "Powerful Pestnuts that thrive underwater. Those sharp spikes are a real threat. Weak against Spear Guys.",
        type: "Melee",
        special: "Spin to Win",
        criticals: [""],
    },
    {
        name: "Chuck Guy",
        url: "https://www.mariowiki.com/images/f/f9/MLSSBMChuckGuy.png",
        desc: "They charge forward wielding a spear. Weak against red Koopa Paratroopas.",
        type: "Melee",
        special: "Spin Cycle",
        criticals: [""],
    },
    {
        name: "Elite Chuck Guy",
        url: "https://www.mariowiki.com/images/7/7d/MLSSBMEliteChuckGuy.png",
        desc: "They resemble regular Chuck Guys but believe themselves to be superior with a spear. Weak against red Koopa Paratroopas.",
        type: "Melee",
        special: "Spin Cycle",
        criticals: [""],
    },
    {
        name: "Clumph",
        url: "https://www.mariowiki.com/images/1/1c/MLSSBMClumph.png",
        desc: "Foes that pride themselves on their POW. They strike the ground with giant clubs",
        type: "Melee",
        special: "Whomping Whallop",
        criticals: [""],
    },
    {
        name: "Piranha Bean",
        url: "https://www.mariowiki.com/images/5/5b/MLSSBMPiranhaBean.png",
        desc: "They spit out powerful flames. Still, they're easily burned themselves, what with being plants and all.",
        type: "Ranged",
        special: "Spitfire Fury",
        criticals: [""],
    },
    {
        name: "Starkiss",
        url: "https://www.mariowiki.com/images/5/58/MLSSBMStarkiss.png",
        desc: "Love hurts, and so do those hearts they spit out! Their bodies are among the lightest in the kingdom.",
        type: "Ranged",
        special: "Spitfire Fury",
        criticals: [""],
    },
    {
        name: "Fuzzbush",
        url: "https://www.mariowiki.com/images/b/b2/MLSSBMFuzzbush.png",
        desc: "They tread lightly on tiny legs. Weak to Fire Bros. and Fire Stalking Piranha Plants.",
        type: "Ranged",
        special: "Rain of Pain",
        criticals: [""],
    },
    {
        name: "Birdo",
        url: "https://www.mariowiki.com/images/1/1b/MLSSBMBirdo.png",
        desc: "She wears a pretty red ribbon atop her pink head. Known to build up power and spit out eggs.",
        type: "Ranged",
        special: "Throw the Fight",
        criticals: [""],
    },
    {
        name: "Popple",
        url: "https://www.mariowiki.com/images/8/8c/MLSSBMPoppleSack.png",
        desc: "The greatest thief in the kingdom...or so he says. Recruited the amnesiac Bowser as his underling",
        type: "Ranged",
        special: "Rain of Pain",
        criticals: [""],
    },
    {
        name: "Mecha-Fawful X",
        url: "https://www.mariowiki.com/images/7/7c/MLSSBMMechawful.png",
        desc: "Mass-produced robots that serve Fawful. They charge into foes with their giant bodies.",
        type: "Melee",
        special: "Charging Champ",
        criticals: [""],
    },
    {
        name: "Mecha-Fawful Y",
        url: "https://www.mariowiki.com/images/3/31/MLSSBMMechawfulHead.png",
        desc: "Mass-produced robots that serve Fawful. Those heads are known to fly about.",
        type: "Flying",
        special: "Cranium Crush",
        criticals: [""],
    },
    {
        name: "Mecha-Fawful Z",
        url: "https://www.mariowiki.com/images/f/fc/MLSSBMMechawfulAlt.png",
        desc: "Mass-produced robots that serve Fawful. They fire powerful beams from their chests",
        type: "Ranged",
        special: "Piercing Projectile",
        criticals: [""],
    },
    {
        name: "Most Furious Fawful X",
        url: "https://www.mariowiki.com/images/e/ed/MLSSBMFawfulAirborne.png",
        desc: "Cackletta's faithful underling. Fights as a Melee trooper.",
        type: "Melee",
        special: "Chain Stomp",
        criticals: [""],
    },
    {
        name: "Most Furious Fawful Y",
        url: "https://www.mariowiki.com/images/e/ed/MLSSBMFawfulAirborne.png",
        desc: "Cackletta's faithful underling. Fights as a Flying trooper.",
        type: "Flying",
        special: "Dive Attack",
        criticals: [""],
    },
    {
        name: "Most Furious Fawful Z",
        url: "https://www.mariowiki.com/images/e/ed/MLSSBMFawfulAirborne.png",
        desc: "Cackletta's faithful underling. Fights as a Ranged trooper.",
        type: "Ranged",
        special: "Chain Shot",
        criticals: [""],
    },
    {
        name: "Fawful",
        url: "https://www.mariowiki.com/images/8/8f/MLSSBMFawful1.png",
        desc: "Cackletta's faithful servant with extreme fury issues. Brainwashes Bowser's Minions to take over the world.",
        type: "Ranged",
        special: "Chain Shot",
        criticals: [""],
    },
];
let specialAttacks = [
    "Air Bash",
    "Smack-Back Attack",
    "Piercing Projectile",
    "Chain Stomp",
    "Rocket Headbutt",
    "Spin to Win",
    "Throw the Fight",
    "Charging Champ",
    "Dive Attack",
    "Whomping Whallop",
    "Chain Shot",
    "Spitfire Fury",
    "Rain of Pain",
    "Spin Cycle",
    "Cranium Crush",
    "Mega Tackle",
    "Kaboom Bash",
    "Power Up",
    "Evasion Cloak",
    "Rock Solid",
    "Sure Shot",
];
function battle(card1, card2) {
    let battleData = [{ points: 0 }, { points: 0 }];
    for (var i = 0; i < specialAttacks.length; i++) {
        if (specialAttacks[i] === card1.special) {
            battleData[0].specialPower = i;
        }
        if (specialAttacks[i] === card2.special) {
            battleData[1].specialPower = i;
        }
    }
    if (battleData[0].specialPower < battleData[1].specialPower) {
        battleData[0].points++;
        console.log("Player 1 got points from special");
    } else if (battleData[1].specialPower < battleData[0].specialPower) {
        battleData[1].points++;
        console.log("Player 2 got points from special");
    }

    for (var i = 0; i < card1.criticals.length; i++) {
        if (card1.criticals[i] === card2.name) {
            battleData[0].points++;
            console.log("Player 1 had a critical hit!");
        }
    }
    for (var i = 0; i < card2.criticals.length; i++) {
        if (card2.criticals[i] === card1.name) {
            battleData[1].points++;
            console.log("Player 2 had a criticial hit!");
        }
    }

    switch (card1.type) {
        case "Melee":
            switch (card2.type) {
                case "Flying":
                    battleData[1].points++;
                    console.log("Flying is better than Melee for Player 2");
                    break;
                case "Ranged":
                    battleData[0].points++;
                    console.log("Melee is better than Flying for Player 1");
                    break;
            }
            break;
        case "Flying":
            switch (card2.type) {
                case "Melee":
                    battleData[0].points++;
                    console.log("Flying is better than Melee for Player 1");
                    break;
                case "Ranged":
                    battleData[1].points++;
                    console.log("Ranged is better than Flying for Player 2");
                    break;
            }
            break;
        case "Ranged":
            switch (card2.type) {
                case "Melee":
                    battleData[1].points++;
                    console.log("Melee is better than Ranged for Player 2");
                    break;
                case "Flying":
                    battleData[0].points++;
                    console.log("Ranged is better than Flying for Player 1");
                    break;
            }
            break;
    }

    if (
        card1.name.startsWith("Captain") ||
        card1.name.startsWith("Gold") ||
        card1.name.startsWith("Elite")
    ) {
        battleData[0].points++;
        console.log("Player 1 gets a preside point");
    }
    if (
        card2.name.startsWith("Captain") ||
        card2.name.startsWith("Gold") ||
        card2.name.startsWith("Elite")
    ) {
        battleData[1].points++;
        console.log("Player 2 gets a preside point");
    }

    if (battleData[0].points > battleData[1].points) {
        console.log("Player 1 had more points than Player 2");
        return 0;
    } else if (battleData[1].points > battleData[0].points) {
        console.log("Player 2 had more points than Player 1");
        return 1;
    } else {
        console.log("Tie");
        return 3;
    }
}
let possIds = require("./possIds.json").ids;

let defaultGuild = {
    webhook: {
        custom: false,
        username: "Kestron-Tron",
        avatar: "https://raw.githubusercontent.com/SMOMusic/Kestron-Tron/main/CyberBario.png",
    },
    counting: {
        channel: "",
    },
    starboard: {
        active: false,
        emote: "⭐",
        threshold: 3,
        posted: {},
        channel: null,
    },
    filter: {
        badWords: [],
        censor: true,
        filter: false,
    },
    reactRoles: {
        messageIds: [],
    },
    stories: {
        active: false,
        channel: null,
        announceChannel: null,
        story: [],
        lastContrib: "",
        nextTurn: null,
        authors: [],
        banned: [],
    },
    logs: {
        log: false,
        channel: null,
        userJoins: false,
        roleChanges: false,
        msgDelete: false,
        msgEdit: false,
        channelCreate: false,
        channelEdit: false,
        userEdit: false,
        serverEdit: false,
    },
    allocated: true,
    prefix: "~",
};
let defaultMember = {
    names: [],
    vc: {},
    spamFilter: {},
    nameLocked: null,
    allocated: true,
};

let rac = {
    board: [],
    lastPlayer: "Nobody",
    timePlayed: 0,
    players: [],
    icons: "!@#$%^&*()_+=[]{};':`~,./<>?0123456789",
};
function getRACBoard() {
    let racChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let mess = [];
    let temp = "  ";
    for (var i = 0; i < rac.board.length; i++) {
        mess.push(racChars[i] + " |" + rac.board[i].join("|") + "|");
        temp += " " + racChars[i];
    }
    mess.unshift(temp);
    mess =
        "Last Moved: <@" +
        rac.lastPlayer +
        "> " +
        (rac.timePlayed !== 0
            ? "<t:" + Math.round(rac.timePlayed / 1000) + ":R>"
            : "") +
        "```\n" +
        mess.join("\n") +
        "```";
    mess += "\nPlayers: ";
    for (var i = 0; i < rac.players.length; i++) {
        mess += "\n<@" + rac.players[i] + ">: `" + rac.icons[i] + "`";
    }
    return "**Rows & Columns**\n" + mess;
}
function readRACBoard(toRead) {
    rac.lastPlayer = toRead.split("<@")[1].split(">")[0];
    try {
        rac.timePlayed = Math.round(
            +toRead.split("<t:")[1].split(":R>")[0] * 1000
        );
    } catch (e) {
        rac.timePlayed = 0;
    }

    let board = toRead.split("```\n")[1].split("```")[0];
    let rows = board.split("\n");
    rac.rowsActive = rows[0].replaceAll(" ", "");
    rows.splice(0, 1);
    for (var i = 0; i < rows.length; i++) {
        rows[i] = rows[i].slice(3, rows[i].length);
        rows[i] = rows[i].replaceAll("|", "");
        rows[i] = rows[i].split("");
    }
    rac.board = rows;

    let tmpPlayers = toRead.split("Players: \n")[1].split("<@");
    rac.players = [];
    for (var i = 1; i < tmpPlayers.length; i++) {
        rac.players.push(tmpPlayers[i].split(">")[0]);
    }
}
function scoreRows(game, char) {
    var score = 0;
    game.forEach((row) => {
        var search = char.repeat(row.length);
        while (search.length > 2 && row) {
            if (row.includes(search)) {
                row =
                    row.substring(0, row.indexOf(search)) +
                    row.substring(row.indexOf(search) + search.length);
                score += search.length - 2;
            } else {
                search = search.substring(1);
            }
        }
    });
    return score;
}
function rotateGame(game) {
    var newGame = [];
    for (var i = 0; i < game.length; i++) {
        var newCol = "";
        for (var j = 0; j < game.length; j++) {
            newCol += game[j][i];
        }
        newGame.push(newCol);
    }
    return newGame;
}
function score(game, char) {
    var score = scoreRows(game, char);
    score += scoreRows(rotateGame(game), char);
    return score;
}
function tallyRac() {
    let scores = []; /*
        let rowOn=0;
        for(var k=0;k<rac.players.length;k++){
                scores[k]=0;
                for(var i=0;i<rac.board.length;i++){
                        rowOn=0;
                        for(var j=0;j<rac.board[i].length;j++){
                                if(rac.board[i][j]===rac.icons[k]){
                                        rowOn++;
                                }
                                else{
                                        if(rowOn>=3) scores[k]+=rowOn-2;
                                        rowOn=0;
                                }
                        }
                }
                for(var i=0;i<rac.board[0].length;i++){
                        rowOn=0;
                        for(var j=0;j<rac.board.length;j++){
                                if(rac.board[j][i]===rac.icons[k]){
                                        rowOn++;
                                }
                                else{
                                        if(rowOn>=3) scores[k]+=rowOn-2;
                                        rowOn=0;
                                }
                        }
                }
        }*/
    for (var i = 0; i < rac.players.length; i++) {
        scores[i] = score(rac.board, rac.icons[i]);
    }

    let mess = [];
    let temp = "  ";
    let racChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (var i = 0; i < rac.board.length; i++) {
        mess.push(racChars[i] + " |" + rac.board[i].join("|") + "|");
        temp += " " + racChars[i];
    }
    mess.unshift(temp);
    let tmpPlays = rac.players.slice(0);
    for (var i = scores.length - 1; i > -1; i--) {
        for (var j = scores.length - 1; j > -1; j--) {
            if (scores[j] > scores[i]) {
                scores.splice(i, 1);
                tmpPlays.splice(i, 1);
                j = -1;
            }
        }
    }
    mess =
        "Winner: <@" +
        tmpPlays.join(">, <@") +
        ">```\n" +
        mess.join("\n") +
        "```";
    mess += "\nPlayers: ";
    for (var i = 0; i < rac.players.length; i++) {
        mess += "\n<@" + rac.players[i] + ">: `" + rac.icons[i] + "`";
    }
    mess = "**Rows & Columns**\n" + mess;
    return mess;
}
async function load() {
    await fetch("https://storage.kestron.repl.co/getFile?file=storage.json")
        .then((d) => d.text())
        .then((d) => {
            fs.writeFileSync("./storage.json", d);
        });
}
//load();
let storage = require("./storage.json");
async function save() {
    await fs.writeFileSync("./storage.json", JSON.stringify(storage));
    fs.readFile("./storage.json", "utf-8", (err, data) => {
        //axios.post('https://storage.kestron.repl.co/saveFile?path=storage.json&token=totallyNotKestron', {body:data});
    });
}
save();
function err(error) {
    console.log(error);
}

const wyrUrl = "https://would-you-rather.p.rapidapi.com/wyr/random";
const wyrOptions = {
    method: "GET",
    headers: {
        "X-RapidAPI-Key": "7bd6392ac6mshceb99882c34c39cp16b90cjsn985bc49d5ae1",
        "X-RapidAPI-Host": "would-you-rather.p.rapidapi.com",
    },
};

const {
    Client,
    Collection,
    Intents,
    Message,
    MessageEmbed,
    WebhookClient,
    MessageActionRow,
    MessageButton,
    Modal,
} = require("discord.js");
const Discord = require("discord.js");
const { defaultMaxListeners } = require("stream");
const { channel } = require("diagnostics_channel");
const client = new Discord.Client({
    partials: [
        "MESSAGE",
        "CHANNEL",
        "REACTION",
        "ADMINISTRATOR",
        "GUILD_MEMBER",
        "CHANNEL",
        "USER",
    ],
    intents: Object.keys(Intents.FLAGS),
});
function callHome(cont) {
    if (cont.length > 1999) {
        cont = cont.slice(0, 1996) + "...";
    }
    client.users.cache.get("949401296404905995").send(cont);
}

client.once("ready", () => {
    console.log("3.0 Online");
    callHome("Restarted at <t:" + Math.floor(new Date() / 1000) + ":f>");
    client.user.setActivity(`Undergoing Maintenance; In between versions`, {
        type: "PLAYING",
        name: "SMOMusic.github.io",
    });
});
client.on("messageCreate", async (msg) => {
    try {
        if (msg.author.bot) {
            return;
        }
        let id = "0";
        try {
            id = msg.guild.id;
        } catch (e) {
            id = "0";
        }
        function perms(perm, ret, me) {
            let tof;
            if (id === "0" && !me) {
                if (ret) {
                    msg.reply("Whoops! Can't do that in DMs!");
                }
                try {
                    return msg.member.id === "949401296404905995";
                } catch (e) {
                    return msg.author.id === "949401296404905995";
                }
            } else if (id === "0") {
                msg.reply("Whoops! I can't do that in DMs!");
                return false;
            }
            if (perm !== "Kestron") {
                tof =
                    msg.member.permissions.has(perm) ||
                    msg.member.id === "949401296404905995";
            } else {
                tof = msg.member.id === "949401296404905995";
            }
            if (ret && !tof && !me) {
                msg.reply(
                    "Whoops! This command needs you to have the following permission: `" +
                        perm +
                        "`."
                );
            }
            if (me) {
                try {
                    tof =
                        msg.guild.members.me.permissions.has(perm) ||
                        msg.guild.members.me.permissions.has("ADMINISTRATOR");
                    if (ret && !tof) {
                        msg.reply(
                            "Whoops! I don't have sufficient permissions for this action! I need the `" +
                                perm +
                                "` permission to do that."
                        );
                    }
                } catch (e) {
                    return false;
                }
            }
            return tof;
        }
        if (id === "0" && !perms("Kestron")) {
            callHome(
                "**" +
                    msg.author.tag +
                    "** |" +
                    msg.author.id +
                    "|\n\n" +
                    msg.content
            );
        } else if (id === "0") {
            try {
                const repliedTo = await msg.fetchReference();
                if (!repliedTo) return;
                client.users.cache
                    .get(repliedTo.content.split("|")[1])
                    .send(msg.content);
                msg.react("✅");
            } catch (e) {}
        }
        try {
            if (!storage[id].allocated) {
                storage[id] = defaultGuild;
            }
        } catch (e) {
            storage[id] = defaultGuild;
        }
        async function sendMsg(what, mimic) {
            if ("" + what === what) what = { content: what };
            if (mimic) {
                let color = msg.member.displayHexColor;

                what.avatarURL = msg.member.displayAvatarURL();
                what.username = msg.member.displayName;
                what.accent = color;

                if (perms("MANAGE_WEBHOOKS", false, true)) {
                    const webhooks = await msg.channel.fetchWebhooks();
                    const webhook = webhooks.find((wh) => wh.token);
                    if (!webhook) {
                        msg.channel.createWebhook("Kestron-Tron", {
                            avatar: "https://raw.githubusercontent.com/SMOMusic/Kestron-Tron/main/CyberBario.png",
                        });
                        msg.channel.send(
                            "Channel readied. Use the command again if the necessary info is not present.\n\n" +
                                (what.content ? what.content : what)
                        );
                        return;
                    }
                    webhook.send(what);
                } else {
                    msg.channel.send(what);
                }
            } else {
                if (storage[id].webhook.custom) {
                } else {
                    msg.channel.send(what);
                }
            }
        }

        if (id !== "0" /*&&!perms("MANAGE_MESSAGES",false)*/) {
            if (msg.content.includes("https://discord.gg/")) {
                let found = msg.content
                    .match(/https:\/\/discord\.gg\/\w*/i)[0]
                    .split("gg/")[1];
                let didIt = false;
                await fetch("https://discord.com/api/v6/invites/" + found)
                    .then((d) => d.json())
                    .then((d) => {
                        for (
                            var i = 0;
                            i < storage[id].filter.badWords.length;
                            i++
                        ) {
                            if (storage[id].filter.badWords[i] === d.guild.id) {
                                didIt = true;
                            }
                        }
                    })
                    .catch((e) => {});
                if (didIt && storage[id].filter.censor) {
                    msg.reply(
                        "Sorry **" +
                            msg.author.tag +
                            "**! This server has blocked that server."
                    );
                    msg.delete();
                    return;
                }
            }
            let temp = msg.content.replace(/(?<=\b\S)\s(?=\S\b)/g, "");
            let temp2 = msg.content.replace(/(?<=\b\S)\s(?=\S\b)/g, "");
            let replacements = ["!1i", "@&a", "#h", "$s", "^+t", "(c", "6b"];
            for (var i = 0; i < replacements.length; i++) {
                let placements = replacements[i].split("/");
                for (var j = 0; j < placements.length - 1; j++) {
                    temp = temp.replaceAll(
                        placements[j],
                        placements[placements.length - 1]
                    );
                    temp2 = temp2.replaceAll(
                        placements[j],
                        placements[placements.length - 1]
                    );
                }
            }
            for (var i = 0; i < storage[id].filter.badWords.length; i++) {
                let badWordRegex = new RegExp(
                    "(\\b|_)" +
                        storage[id].filter.badWords[i] +
                        "(ing|er|ed|s)?\\b",
                    "ig"
                );
                temp = temp.replace(badWordRegex, "[\\_]");
            }
            if (temp !== temp2) {
                if (storage[id].filter.censor) {
                    sendMsg(
                        "```\nThe following post was censored by Kestron-Tron```" +
                            temp,
                        true
                    );
                }
                if (storage[id].logs.log) {
                    try {
                        msg.guild.channels.cache
                            .get(storage[id].logs.channel)
                            .send(
                                `Message by **${msg.author.tag}** in ${msg.channel} deleted due to blocked words being found in the message.\n\n\`\`\`\n${msg.content}\`\`\``
                            );
                    } catch (e) {}
                }
                try {
                    msg.author.send(
                        `Your post in **${msg.guild.name}** was removed due to blocked words being found in the message.\n\n\`\`\`\n${msg.content}\`\`\``
                    );
                } catch (e) {}
                msg.delete();
                if (
                    msg.author.id === "1094132198891851857" ||
                    msg.author.id === "974055786617634836"
                ) {
                    msg.author.timeout("60*1000*5");
                    msg.channel.send(
                        "Attempted to timeout **" +
                            msg.author.tag +
                            "** due to reaching the maximum number of blocked messages within a certain period of time."
                    );
                }
                return;
            }
        }
        try {
            if (msg.channel.name.includes("Cleverbot")) {
                await msg.channel.messages
                    .fetch({ limit: 100 })
                    .then((messages) => {
                        let messes = [];
                        messages.forEach((message) =>
                            messes.push(message.content)
                        );
                        cleverbot(msg.content, messes).then((d) => {
                            msg.reply(d);
                        });
                    });
            }
        } catch (e) {}
        if (
            !msg.content.startsWith(storage[id].prefix) &&
            storage[id].sentAnal
        ) {
            let analRes = ml.classify(msg.content); //
            let emote = "❌";
            if (analRes >= 5) {
                emote = "😁";
            } else if (analRes >= 4) {
                emote = "😄"; //
            } else if (analRes >= 2) {
                emote = "😃";
            } else if (analRes === 1) {
                emote = "🙂";
            } else if (analRes === 0) {
                emote = "😐";
            } else if (analRes <= 0) {
                emote = "😕";
            } else {
                emote = "☹️";
            }
            console.log(emote);
            msg.react(emote);
        }
        if (msg.content === "~prefix") {
            sendMsg(
                "Current prefix for " +
                    msg.guild.name +
                    " is `" +
                    (storage[id].prefix !== "`"
                        ? "`" + storage[id].prefix + "`"
                        : storage[id].prefix)
            );
        }
        if (msg.content.toLowerCase().startsWith(storage[id].prefix)) {
            let comm = msg.content
                .slice(storage[id].prefix.length, msg.content.length)
                .toLowerCase();
            if (comm.startsWith("retrieve")) {
                let programId = comm.split(" ")[1];
                console.log(programId);
                await fetch(
                    "https://kap-archive.shipment22.repl.co/g/" + programId
                )
                    .then((d) => d.json())
                    .then(async (d) => {
                        d = d[0];
                        await fs.writeFileSync("./code.txt", d.code);
                        sendMsg({
                            embeds: [
                                {
                                    type: "rich",
                                    title: `doodle jump`,
                                    description: "\u200b",
                                    color: 0x00ff00,
                                    fields: [
                                        {
                                            name: `Created`,
                                            value: `${new Date(
                                                d.created
                                            ).toDateString()}`,
                                            inline: true,
                                        },
                                        {
                                            name: `Backed-up revision`,
                                            value: `${new Date(
                                                d.updated
                                            ).toDateString()}`,
                                            inline: true,
                                        },
                                        {
                                            name: `Width/Height`,
                                            value: `${d.width}/${d.height}`,
                                            inline: true,
                                        },
                                        {
                                            name: `Votes`,
                                            value: `${d.votes}`,
                                            inline: true,
                                        },
                                        {
                                            name: `Spin-Offs`,
                                            value: `${d.spinoffs}`,
                                            inline: true,
                                        },
                                    ],
                                    image: {
                                        url: `${d.thumbnail}`,
                                        height: 0,
                                        width: 0,
                                    },
                                    thumbnail: {
                                        url: `https://media.discordapp.net/attachments/810540153294684195/994417360737935410/ka-logo-zoomedout.png`,
                                        height: 0,
                                        width: 0,
                                    },
                                    author: {
                                        name: `${d.creator.nickname}`,
                                        url: `https://www.khanacademy.org/profile/${d.creator.kaid}`,
                                    },
                                    footer: {
                                        text: `Retrieved from https://kap-archive.shipment22.repl.co/`,
                                        icon_url: `https://media.discordapp.net/attachments/810540153294684195/994417360737935410/ka-logo-zoomedout.png`,
                                    },
                                    url: `https://khanacademy.org/`,
                                },
                            ],
                            files: ["./code.txt"],
                        });
                    })
                    .catch((e) => {
                        sendMsg(
                            "It appears that program was not backed up - apologies."
                        );
                    });
            }
            if (comm.startsWith("prechange")) {
                storage[id].prefix = comm.split(" ")[1];
                sendMsg(
                    "New prefix for " +
                        msg.guild.name +
                        " is `" +
                        storage[id].prefix +
                        "`"
                );
                save();
            } else if (comm.startsWith("pre") && !comm.startsWith("prefix")) {
                sendMsg("Whoops! Moved to `preChange`");
            }
            if (
                comm.startsWith("verify") &&
                msg.guild.id === "810540153294684192"
            ) {
                let kaidOrUsername = msg.content.split("/profile/")[1];
                if (kaidOrUsername.includes("/")) {
                    kaidOrUsername = kaidOrUsername.split("/")[0];
                }
                if (kaidOrUsername.includes("]")) {
                    kaidOrUsername = kaidOrUsername.split("]")[0];
                }
                console.log("Hello");
                if (
                    msg.content.slice(8, msg.content.length).length > 0 &&
                    !msg.content.includes("/me")
                ) {
                    console.log("Hi");
                    try {
                        let found = "";
                        await fetch(
                            "https://www.khanacademy.org/api/internal/graphql/getFullUserProfile",
                            {
                                headers: {
                                    "x-ka-fkey": "KhancordVerificationSystem",
                                },
                                body:
                                    '{"operationName":"getFullUserProfile","variables":{"' +
                                    (kaidOrUsername.startsWith("kaid_")
                                        ? "kaid"
                                        : "username") +
                                    '":"' +
                                    kaidOrUsername +
                                    '"},"query":"query getFullUserProfile($kaid: String, $username: String) {\\n  user(kaid: $kaid, username: $username) {\\n    id\\n    kaid\\n    key\\n    userId\\n    email\\n    username\\n    profileRoot\\n    gaUserId\\n    isPhantom\\n    isDeveloper: hasPermission(name: \\"can_do_what_only_admins_can_do\\")\\n    isCurator: hasPermission(name: \\"can_curate_tags\\", scope: ANY_ON_CURRENT_LOCALE)\\n    isCreator: hasPermission(name: \\"has_creator_role\\", scope: ANY_ON_CURRENT_LOCALE)\\n    isPublisher: hasPermission(name: \\"can_publish\\", scope: ANY_ON_CURRENT_LOCALE)\\n    isModerator: hasPermission(name: \\"can_moderate_users\\", scope: GLOBAL)\\n    isParent\\n    isTeacher\\n    isDataCollectible\\n    isChild\\n    isOrphan\\n    isCoachingLoggedInUser\\n    canModifyCoaches\\n    nickname\\n    hideVisual\\n    joined\\n    points\\n    countVideosCompleted\\n    bio\\n    profile {\\n      accessLevel\\n      __typename\\n    }\\n    soundOn\\n    muteVideos\\n    showCaptions\\n    prefersReducedMotion\\n    noColorInVideos\\n    newNotificationCount\\n    canHellban: hasPermission(name: \\"can_ban_users\\", scope: GLOBAL)\\n    canMessageUsers: hasPermission(name: \\"can_send_moderator_messages\\", scope: GLOBAL)\\n    isSelf: isActor\\n    hasStudents: hasCoachees\\n    hasClasses\\n    hasChildren\\n    hasCoach\\n    badgeCounts\\n    homepageUrl\\n    isMidsignupPhantom\\n    includesDistrictOwnedData\\n    canAccessDistrictsHomepage\\n    preferredKaLocale {\\n      id\\n      kaLocale\\n      status\\n      __typename\\n    }\\n    underAgeGate {\\n      parentEmail\\n      daysUntilCutoff\\n      approvalGivenAt\\n      __typename\\n    }\\n    authEmails\\n    signupDataIfUnverified {\\n      email\\n      emailBounced\\n      __typename\\n    }\\n    pendingEmailVerifications {\\n      email\\n      __typename\\n    }\\n    hasAccessToAIGuideTeacher\\n    tosAccepted\\n    shouldShowAgeCheck\\n    birthMonthYear\\n    lastLoginCountry\\n    __typename\\n  }\\n  actorIsImpersonatingUser\\n  isAIGuideEnabled\\n  hasAccessToAIGuideDev\\n}\\n"}',
                                    // '"},"query":"query getFullUserProfile($kaid: String, $username: String) {\\n  user(kaid: $kaid, username: $username) {\\n    id\\n    kaid\\n    key\\n    userId\\n    email\\n    username\\n    profileRoot\\n    gaUserId\\n    isPhantom\\n    isDeveloper: hasPermission(name: \\"can_do_what_only_admins_can_do\\")\\n    isCurator: hasPermission(name: \\"can_curate_tags\\", scope: ANY_ON_CURRENT_LOCALE)\\n    isCreator: hasPermission(name: \\"has_creator_role\\", scope: ANY_ON_CURRENT_LOCALE)\\n    isPublisher: hasPermission(name: \\"can_publish\\", scope: ANY_ON_CURRENT_LOCALE)\\n    isModerator: hasPermission(name: \\"can_moderate_users\\", scope: GLOBAL)\\n    isParent\\n    isTeacher\\n    isDataCollectible\\n    isChild\\n    isOrphan\\n    isCoachingLoggedInUser\\n    canModifyCoaches\\n    nickname\\n    hideVisual\\n    joined\\n    points\\n    countVideosCompleted\\n    bio\\n    profile {\\n      accessLevel\\n      __typename\\n    }\\n    soundOn\\n    muteVideos\\n    showCaptions\\n    prefersReducedMotion\\n    noColorInVideos\\n    newNotificationCount\\n    canHellban: hasPermission(name: \\"can_ban_users\\", scope: GLOBAL)\\n    canMessageUsers: hasPermission(name: \\"can_send_moderator_messages\\", scope: GLOBAL)\\n    isSelf: isActor\\n    hasStudents: hasCoachees\\n    hasClasses\\n    hasChildren\\n    hasCoach\\n    badgeCounts\\n    homepageUrl\\n    isMidsignupPhantom\\n    includesDistrictOwnedData\\n    canAccessDistrictsHomepage\\n    preferredKaLocale {\\n      id\\n      kaLocale\\n      status\\n      __typename\\n    }\\n    underAgeGate {\\n      parentEmail\\n      daysUntilCutoff\\n      approvalGivenAt\\n      __typename\\n    }\\n    authEmails\\n    signupDataIfUnverified {\\n      email\\n      emailBounced\\n      __typename\\n    }\\n    pendingEmailVerifications {\\n      email\\n      __typename\\n    }\\n    tosAccepted\\n    shouldShowAgeCheck\\n    birthMonthYear\\n    lastLoginCountry\\n    __typename\\n  }\\n  actorIsImpersonatingUser\\n  isAIGuideEnabled\\n  hasAccessToAIGuideDev\\n}\\n"}',
                                method: "POST",
                            }
                        )
                            .then((d) => d.json())
                            .then((d) => {
                                found = d.data.user.bio;
                            });
                        if (found === "KhancordVerify-" + msg.author.id) {
                            let used = msg.guild.members.cache.get(
                                msg.author.id
                            );
                            msg.reply(
                                "Account ownership confirmed. You may put your bio back to normal now. Staff will be reviewing your verification request and will get back to you shortly.\n\n<@&1046265564479361075>, account is ready for review. Discord account was created <t:" +
                                    Math.floor(msg.author.createdAt / 1000) +
                                    ":R>."
                            );
                        } else {
                            msg.reply(
                                "Whoops! Bio does not match! Please edit it to say `KhancordVerify-" +
                                    msg.author.id +
                                    "`"
                            );
                        }
                    } catch (e) {
                        console.log(e);
                        msg.reply(
                            "Whoops! Something went wrong! Report the following to Kestron#9271:\n" +
                                e
                        );
                    }
                }
            }
            if (comm.startsWith("prank") && perms("MANAGE_MEMBERS", true)) {
                storage[id].prank = {};
                msg.guild.members.cache.forEach((member) => {
                    if (member.bannable || member.id === client.id) {
                        storage[id].prank[member.id] = member.nickname
                            ? member.nickname
                            : member.user.username;
                    }
                });
                let prankers = Object.keys(storage[id].prank);
                msg.guild.members.cache.forEach((member) => {
                    if (member.id !== msg.guild.ownerId) {
                        if (member.bannable || member.id === client.id) {
                            let i = Math.floor(Math.random() * prankers.length);
                            member.setNickname(storage[id].prank[prankers[i]]);
                            prankers.splice(i, 1);
                        }
                    }
                });
                save();
                msg.author.send(
                    "https://tenor.com/view/troll-pilled-gif-19289988"
                );
                msg.delete();
            }
            if (comm.startsWith("unprank") && perms("MANAGE_MEMBERS", true)) {
                msg.guild.members.cache.forEach((member) => {
                    if (
                        (member.bannable || member.id === client.id) &&
                        member.id !== msg.guild.ownerId &&
                        storage[id].prank[member.id]
                    ) {
                        member.setNickname(storage[id].prank[member.id]);
                    }
                });
                msg.author.send(
                    "https://tenor.com/view/troll-pilled-gif-19289988"
                );
                msg.delete();
            }
            if (comm.startsWith("say") && perms("Kestron")) {
                msg.channel.send(msg.content.slice(5, msg.content.length));
                msg.delete();
            }
            if (comm.startsWith("echo") && perms("MANAGE_MESSAGES")) {
                msg.channel.send({
                    content: msg.content.slice(6, msg.content.length),
                    tts: true,
                });
                msg.delete();
            }
            if (comm.startsWith("eval") && perms("Kestron")) {
                try {
                    eval(msg.content.slice("6", msg.content.length));
                } catch (e) {
                    msg.channel.send("Whoops!\n" + e);
                } finally {
                    msg.channel.send("Evaluated");
                }
                msg.delete();
            }
            if (comm.startsWith("cleverbot")) {
                if (!msg.channel.name.includes("Cleverbot")) {
                    let aiThread = await msg.startThread({
                        name: `Cleverbot AI | ` + msg.author.id,
                        autoArchiveDuration: 10080,
                        type: "GUILD_PUBLIC_THREAD",
                    });
                    await aiThread.join();
                    msg.reply(
                        "I have generated a thread for you to use. Please do not rename the thread or it will end the conversation. To end the conversation, close the thread.\n\n*The responses generated by Cleverbot are AI and thus can be tainted, and do not necessarily represent the creator.*"
                    );
                } else {
                    msg.reply("You're in a thread. Cannot fulfill.");
                }
            }
            if (comm.startsWith("sentanal")) {
                storage[id].sentAnal = true;
                msg.reply(
                    "Sentiment Analysis activated! Type '~stopSent' to end sentiment analysis.\n\nSentiment Analysis will be shown in the form of reactions."
                );
            }
            if (comm.startsWith("test")) {
                msg.reply(
                    "```\n" +
                        msg.content.replace(/(?<=\s\S)\s(?=\S\s)/g, "") +
                        "```"
                );
            }
            if (comm.startsWith("stopsent")) {
                storage[id].sentAnal = false;
                msg.reply("Sentiment Analysis deactivated.");
                save();
            }
            if (comm.startsWith("storypart")) {
                try {
                    let repliedTo = await msg.channel.messages.fetch(
                        msg.reference.messageId
                    );
                    let gId = repliedTo.content.split("\n")[0];
                    if (storage[gId].stories.nextTurn === msg.author.id) {
                        if (msg.content.slice(11, msg.content.length) === 0) {
                            msg.reply(
                                "You need to write something! If you want to skip, use `/skip_story_turn`."
                            );
                            return;
                        }
                        storage[gId].stories.story.push(
                            msg.content.slice(11, msg.content.length)
                        );
                        msg.reply("Added to the story.");
                        while (
                            storage[gId].stories.nextTurn === msg.author.id
                        ) {
                            storage[gId].stories.nextTurn =
                                storage[gId].stories.authors[
                                    Math.floor(
                                        Math.random() *
                                            storage[gId].stories.authors.length
                                    )
                                ];
                        }
                        await fs.writeFileSync(
                            "story.txt",
                            storage[gId].stories.story.join(" ")
                        );
                        client.users.cache
                            .find(
                                (user) =>
                                    user.id === storage[gId].stories.nextTurn
                            )
                            .send({
                                content:
                                    gId +
                                    "\nIt is now your turn to write the story! Reply to this message with `~storyPart And then type your sentence here`",
                                files: ["./story.txt"],
                            });
                        console.log(gId + " | " + storage[gId].stories);
                        try {
                            client.guilds.cache
                                .get(gId)
                                .channels.cache.get(
                                    storage[gId].stories.announceChannel
                                )
                                .send({
                                    embeds: [
                                        {
                                            type: "rich",
                                            title: "Current Story Turn",
                                            description: `<@${storage[gId].stories.nextTurn}>`,
                                            color: 0xff0000,
                                        },
                                    ],
                                });
                        } catch (e) {}
                        client.guilds.cache
                            .get(gId)
                            .channels.cache.get(storage[gId].stories.channel)
                            .send(
                                "**" +
                                    msg.author.tag +
                                    "**\n" +
                                    msg.content.slice(11, msg.content.length)
                            );
                    } else {
                        msg.reply("Wait your turn!");
                    }
                } catch (e) {
                    msg.reply(
                        "Make sure to reply to the notification I sent you."
                    );
                    console.log(e);
                }
                save();
            }
        }
        var programsInMessage = kaProgramRegex.exec(msg.content);
        if (programsInMessage === null) {
            programsInMessage = [];
        }
        if (programsInMessage.length >= 1) {
            msg.suppressEmbeds(true);
            let embs = [];
            for (var i = 0; i < programsInMessage.length && i < 10; i++) {
                await fetch(
                    "https://kap-archive.shipment22.repl.co/s/" +
                        programsInMessage[i].split("/")[
                            programsInMessage[i].split("/").length - 1
                        ]
                )
                    .then((d) => d.json())
                    .then((d) => {
                        embs.push({
                            type: "rich",
                            title: d.title,
                            description: `\u200b`,
                            color: 0x00ff00,
                            author: {
                                name: `Made by ${d.creator.nickname}`,
                                url: `https://www.khanacademy.org/profile/${d.creator.kaid}`,
                            },
                            fields: [
                                {
                                    name: `Created`,
                                    value: `${new Date(
                                        d.created
                                    ).toDateString()}`,
                                    inline: true,
                                },
                                {
                                    name: `Updated`,
                                    value: `${new Date(
                                        d.updated
                                    ).toDateString()}`,
                                    inline: true,
                                },
                                {
                                    name: `Width/Height`,
                                    value: `${d.width}/${d.height}`,
                                    inline: true,
                                },
                                {
                                    name: `Votes`,
                                    value: `${d.votes}`,
                                    inline: true,
                                },
                                {
                                    name: `Spin-Offs`,
                                    value: `${d.spinoffs}`,
                                    inline: true,
                                },
                            ],
                            image: {
                                url: `https://www.khanacademy.org/computer-programming/i/${d.id}/latest.png`,
                                height: 0,
                                width: 0,
                            },
                            thumbnail: {
                                url: `https://media.discordapp.net/attachments/810540153294684195/994417360737935410/ka-logo-zoomedout.png`,
                                height: 0,
                                width: 0,
                            },
                            footer: {
                                text: `Backed up to https://kap-archive.shipment22.repl.co/`,
                                icon_url: `https://media.discordapp.net/attachments/810540153294684195/994417360737935410/ka-logo-zoomedout.png`,
                            },
                            url: `https://www.khanacademy.org/cs/i/${d.id}`,
                        });
                    })
                    .catch((e) => {});
            }
            msg.channel.send({
                content:
                    "Succesfully backed up to the KAP Archive. Type `~retrieve " +
                    programsInMessage[0].split("/")[
                        programsInMessage[0].split("/").length - 1
                    ] +
                    "` to access archived data.",
                embeds: embs,
            });
        }
    } catch (e) {
        console.log(e);
    }
    try {
        var messageEmbeds = discordMessageRegex.exec(msg.content);
        if (messageEmbeds !== null && messageEmbeds.length > 0) {
            let embs = [];
            var j = 0;
            console.log(
                messageEmbeds[j].split("channels/")[1].split("/")[0] +
                    "\n\n" +
                    messageEmbeds[j].split("channels/")[1].split("/")[1] +
                    "\n\n" +
                    messageEmbeds[j].split("channels/")[1].split("/")[2]
            );
            let mess = await client.guilds.cache
                .get(messageEmbeds[j].split("channels/")[1].split("/")[0])
                .channels.cache.get(
                    messageEmbeds[j].split("channels/")[1].split("/")[1]
                )
                .messages.fetch(
                    messageEmbeds[j].split("channels/")[1].split("/")[2]
                );
            console.log(mess.content);
            let messEmbed = new MessageEmbed()
                .setColor(mess.author.displayHexColor)
                .setTitle("(Jump to message)")
                .setURL(messageEmbeds[j])
                .setAuthor({
                    name: mess.author.username,
                    iconURL: "" + mess.author.displayAvatarURL(),
                    url: "https://discord.com/users/" + mess.author.id,
                })
                .setDescription(mess.content)
                .setTimestamp(new Date(mess.createdTimestamp))
                .setFooter({
                    text: mess.guild.name + " / " + mess.channel.name,
                    iconURL: mess.guild.iconURL(),
                })
                .setImage(
                    mess.attachments.first()
                        ? mess.attachments.first().proxyURL
                        : ""
                ); //.setImage(thin);
            let messFiles = [];
            let i = 0;
            mess.attachments.forEach((attached) => {
                let url = attached.proxyURL.toLowerCase();
                if (
                    i !== 0 ||
                    (!url.includes("jpg") &&
                        !url.includes("png") &&
                        !url.includes("jpeg") &&
                        !url.includes("gif"))
                ) {
                    messFiles.push(attached.proxyURL);
                }
                i++;
            });
            embs.push(messEmbed);
            msg.channel.send({
                content:
                    "Embedded linked message. You can prevent this behaviour with `<` and `>` on both sides of the link.",
                embeds: embs,
                files: messFiles,
            });
        }
    } catch (e) {
        console.log(e);
    }

    //Reaction roles
    let doReaction = true;
    try {
        let dmCheck = msg.guild.id;
    } catch (e) {
        doReaction = false;
    }
    if (
        msg.content.startsWith("~role") &&
        msg.member.permissions.has("MANAGE_ROLES") &&
        doReaction
    ) {
        console.log("In the command");
        let found = false;
        for (var i = 0; i < store.guilds.length; i++) {
            if (store.guilds[i] === msg.guild.id) {
                found = true;
            }
        }
        if (!found) {
            store.guilds.push(msg.guild.id);
            store.names.push([]);
            store.emotes.push([]);
        }
        console.log("Logged");
        let val =
            "**Reaction Roles**\nReact with the emoji for the role you want! (*Legacy*)\n";
        let name = "";
        let emote = "";
        emotes = [];
        let names = [];
        let mode = 0;
        for (var i = 7; i < msg.content.length; i++) {
            if (mode === 0) {
                if (msg.content[i] !== `,`) {
                    name += msg.content[i];
                } else {
                    mode = 1;
                    i++;
                    names.push(name);
                }
            }
            if (mode === 1) {
                if (msg.content[i] !== `"`) {
                    emote += msg.content[i];
                } else {
                    mode = 0;
                    emotes.push(emote);
                    val += "\n" + name + ": " + emote;
                    emote = "";
                    name = "";
                }
            }
        }
        console.log("Sending");
        msg.channel.send(val).then((mess) => {
            console.log("Logging the ID");
            store.ids += mess.id;
            fs.writeFileSync(
                "store.js",
                "exports.datum=" + JSON.stringify(store)
            );
            emotes.forEach((e) => {
                mess.react(e);
            });
        });
        for (var i = 0; i < store.guilds.length; i++) {
            if (store.guilds[i] === msg.guild.id) {
                for (var j = 0; j < names.length; j++) {
                    store.names[i].push(names[j]);
                    store.emotes[i].push(emotes[j]);
                }
            }
        }
        fs.writeFileSync("store.js", "exports.datum=" + JSON.stringify(store));
        try {
            msg.delete();
        } catch (e) {}
    }
    if (
        msg.content.startsWith("~role") &&
        !msg.member.permissions.has("MANAGE_ROLES")
    ) {
        msg.reply(
            "Whoops! You don't have sufficient permissions! Make sure you're allowed to Manage Roles!"
        );
    }
    console.log(
        "" +
            msg.content.startsWith("**Reaction") +
            (msg.author.id === client.user.id)
    );

    //Counting
    let doCount = true;
    try {
        id = msg.guild.id;
    } catch (e) {
        id = 0;
    }
    if (id === 0 || msg.author.bot) {
        doCount = false;
    }
    let perms = function (perm) {
        if (id !== 0) {
            if (
                perm === "Kestron" ||
                msg.author.id === "949401296404905995" ||
                msg.author.id === "974055786617634836"
            ) {
                return (
                    msg.author.id === "949401296404905995" ||
                    msg.author.id === "974055786617634836"
                );
            }
            return id === 0 || msg.member.permissions.has(perm);
        } else {
            return false;
        }
    };
    if (doCount) {
        let cOn = -1;
        for (var i = 0; i < cData.length; i++) {
            if (cData[i].guildID === msg.guild.id) {
                cOn = i;
            }
        }
        if (cOn === -1) {
            cOn = cData.length;
            cData.push({
                guildID: msg.guild.id,
                countChannel: null,
                nextNum: 1,
                highestNum: 0,
                beenReset: false,
                guildName: msg.guild.name,
                lastPosted: null,
                legit: true,
            });
        }
        for (var i = 0; i < cData.length; i++) {
            if (cData[i].guildID === msg.guild.id) {
                if (cOn !== i) {
                    for (var i = 0; i < cData.length; i++) {
                        if (cData[i].guildID === msg.guild.id) {
                            cOn = i;
                        }
                    }
                }
            }
        }
        if (
            cData[cOn].guildName === undefined ||
            cData[cOn].guildName === null
        ) {
            cData[cOn].guildName = msg.guild.name;
            cDataUpdate();
        }
        if (msg.guild.id === "1009615461010374736") {
            cData.splice(cOn, 1);
            cDataUpdate();
            return;
        }

        if (
            msg.content.toLowerCase().startsWith("~nocount") &&
            perms("MANAGE_MESSAGES") &&
            cData[cOn].countChannel === msg.channel.id
        ) {
            cData[cOn].countChannel = null;
            msg.channel.send(
                "Alright, I have deactivated counting for this server. To reactivate it, type `~countHere` in the channel you wish to use."
            );
            cDataUpdate();
        }
        if (
            msg.content.toLowerCase().startsWith("~counthere") &&
            perms("MANAGE_MESSAGES")
        ) {
            cData[cOn].countChannel = msg.channel.id;
            msg.channel.send(
                "The counting channel is now set here. Any messages posted will need to be the next number or it will reset the count. If you would like to turn this off, type `~noCount`.\n\nThe next number to post is: " +
                    cData[cOn].nextNum
            );
            cDataUpdate();
        }
        if (
            msg.content.toLowerCase().startsWith("~countat") &&
            perms("MANAGE_MESSAGES")
        ) {
            if (!isNaN(+msg.content.slice(9, msg.content.length))) {
                msg.channel.send(
                    "Alright, the next number to post is now `" +
                        +msg.content.slice(9, msg.content.length) +
                        "`."
                );
                cData[cOn].nextNum = +msg.content.slice(9, msg.content.length);
                cData[cOn].legit = false;
            } else {
                msg.channel.send("Whoops! That's not a number!");
            }
        }
        if (msg.content.toLowerCase().startsWith("~countleader")) {
            cData.sort(function (a, b) {
                return b.highestNum - a.highestNum;
            });
            let countRes = "";
            if (cData.length < 10) {
                for (var i = 0; i < cData.length; i++) {
                    countRes +=
                        "\n" +
                        (i + 1) +
                        ". " +
                        cData[i].guildName +
                        ": " +
                        cData[i].highestNum;
                }
            } else {
                for (var i = 0; i < 9; i++) {
                    countRes +=
                        "\n" +
                        (i + 1) +
                        ". " +
                        cData[i].guildName +
                        ": " +
                        cData[i].highestNum;
                }
            }
            msg.channel.send(
                "Here's the counting leaderboard: " +
                    countRes +
                    "\n\nThe record for " +
                    msg.guild.name +
                    " is " +
                    cData[cOn].highestNum
            );
        }
        if (msg.content.toLowerCase().startsWith("~nextnum")) {
            msg.reply("The next number to post is " + cData[cOn].nextNum);
        }
    }

    //Goomba Squad
    if (msg.author.bot) {
        return;
    }
    if (!goomStorage[msg.author.id]) {
        goomStorage[msg.author.id] = {
            cards: [],
            wins: 0,
            losses: 0,
            draws: 0,
            joined: false,
            challenging: null,
            postChannel: null,
            leaving: false,
        };
        save();
    }
    function inDm() {
        try {
            if (msg.guild.id) {
                return false;
            }
        } catch (e) {
            return true;
        }
    }
    function In(respond) {
        if (goomStorage[msg.author.id].joined) {
            return true;
        } else {
            if (respond || respond === null || respond === undefined) {
                reply(
                    "Whoops! You're not in GoombaSquad yet! If you would like to join, type `" +
                        prefix +
                        "join`"
                );
            }
            return false;
        }
    }
    async function reply(txt, attachments, embs, ava) {
        if (!inDm()) {
            //Webhook
            let webhooks = await msg.channel.fetchWebhooks();
            let webhook = webhooks.find((wh) => wh.token);

            if (!webhook) {
                msg.channel.createWebhook("GoombaSquad", {
                    avatar: "https://raw.githubusercontent.com/SMOMusic/Kestron-Tron/main/MQCaptainGoomba.png",
                });
                msg.channel.send({
                    content: "Channel readied.\n" + txt,
                    files: attachments,
                    embeds: embs,
                });
                return;
            }
            await webhook.send({
                content: txt,
                files: attachments,
                embeds: embs,
                username: "GoombaSquad",
                avatarURL:
                    ava ||
                    "https://raw.githubusercontent.com/SMOMusic/Kestron-Tron/main/MQCaptainGoomba.png",
            });
        } else {
            //No webhook
            msg.channel.send({
                content: txt,
                files: attachments,
                embeds: embs,
            });
        }
    }
    if (msg.content[0] === prefix) {
        console.log("Whoop!");
        let comm = msg.content.slice(1, msg.content.length).toLowerCase();
        if (comm.startsWith("help")) {
            reply(null, null, [
                {
                    type: "rich",
                    title: `GoombaSquad Help Menu`,
                    description: "",
                    color: 0xff0000,
                    fields: [
                        {
                            name: `${prefix}help`,
                            value: `The commands that work with GoombaSquad`,
                            inline: true,
                        },
                        {
                            name: `${prefix}how`,
                            value: "How to play the game",
                            inline: true,
                        },
                        {
                            name: `${prefix}singlePlayer`,
                            value: "Play against me",
                            inline: true,
                        },
                        {
                            name: `${prefix}cards`,
                            value: `Display the cards you have available`,
                            inline: true,
                        },
                        {
                            name: `${prefix}info [ID]`,
                            value: `Get more specific info on a card`,
                            inline: true,
                        },
                        {
                            name: `${prefix}join`,
                            value: `Get a set of cards to start playing with!`,
                            inline: true,
                        },
                        {
                            name: `${prefix}leave`,
                            value: `Divy up your cards to other players and quit the game`,
                            inline: true,
                        },
                        {
                            name: `${prefix}challenge`,
                            value: `Challenge another person to play!`,
                            inline: true,
                        },
                    ],
                    thumbnail: {
                        url: `https://mario.wiki.gallery/images/9/9c/MQTSFB_logo.png`,
                    },
                },
            ]);
        }
        if (comm.startsWith("specials")) {
            let specialMsg =
                "The higher the special is in this list, the more powerful it is.\n";
            for (var i = 0; i < specialAttacks.length; i++) {
                specialMsg += "\n" + (i + 1) + ". " + specialAttacks[i];
            }
            reply(specialMsg);
        }
        if (comm.startsWith("join")) {
            if (goomStorage[msg.author.id].joined) {
                reply(
                    "You're already in GoombaSquad! If you want to leave, type `=leave`."
                );
            } else {
                goomStorage[msg.author.id].joined = true;
                for (var i = 0; i < 8; i++) {
                    let curCard = await possibleCards[
                        Math.floor(Math.random() * possibleCards.length)
                    ];
                    curCard.history = [msg.author.tag];
                    let possIds = await require("./possIds.json").ids;
                    curCard.id = possIds[0];
                    curCard.wins = 0;
                    curCard.losses = 0;
                    curCard.draws = 0;
                    possIds.splice(0, 1);
                    await fs.writeFileSync(
                        "./possIds.json",
                        `{"ids":` + JSON.stringify(possIds) + `}`
                    );
                    goomStorage[msg.author.id].cards.push(curCard);
                    curCard = {};
                }
                reply(
                    "Welcome! You have been granted 8 cards to start with. Type `=cards` to view them.\nIf you ever decide to leave, type `=leave`. (This will remove your progress)"
                );
                save();
                let foundBadId = true;
                while (foundBadId) {
                    foundBadId = false;
                    for (
                        var i = 0;
                        i < goomStorage[msg.author.id].cards.length;
                        i++
                    ) {
                        for (
                            var j = 0;
                            j < goomStorage[msg.author.id].cards.length;
                            j++
                        ) {
                            if (
                                i !== j &&
                                goomStorage[msg.author.id].cards[i].id ===
                                    goomStorage[msg.author.id].cards[j].id
                            ) {
                                goomStorage[msg.author.id].cards[j].id =
                                    possIds[0];
                                possIds.splice(0, 1);
                                await fs.writeFileSync(
                                    "./possIds.json",
                                    `{"ids":` + JSON.stringify(possIds) + `}`
                                );
                                foundBadId = true;
                            }
                        }
                    }
                }
            }
        }
        if (comm.startsWith("leave") && In()) {
            if (goomStorage[msg.author.id].joined) {
                if (goomStorage[msg.author.id].leaving) {
                    reply("Sorry to see you go. Reset your progress.");
                    goomStorage[msg.author.id].joined = false;
                    let possPeeps = Object.keys(goomStorage);
                    try {
                        for (
                            var i = 0;
                            i < goomStorage[msg.author.id].cards.length;
                            i++
                        ) {
                            goomStorage[
                                possPeeps[
                                    Math.floor(Math.random() * possPeeps.length)
                                ]
                            ].cards.push(goomStorage[msg.author.id].cards[i]);
                        }
                        goomStorage[msg.author.id].cards = [];
                    } catch (e) {
                        console.log("Error divying cards");
                    }
                } else {
                    reply(
                        "Warning! This will completely reset all progress. Please confirm you would like to leave by typing the command again."
                    );
                    goomStorage[msg.author.id].leaving = true;
                }
                save();
            } else {
                reply("Whoops! You're not in GoombaSquad yet! Type `=join`");
            }
        }
        if (comm.startsWith("cards") && In()) {
            let i = 0;
            while (i < goomStorage[msg.author.id].cards.length) {
                let thisPost = 1;
                let curEmbs = [];
                while (
                    thisPost <= 10 &&
                    i < goomStorage[msg.author.id].cards.length
                ) {
                    let curCard = goomStorage[msg.author.id].cards[i];
                    let curEmb = {
                        type: "rich",
                        title: curCard.name + " #" + curCard.id,
                        description: `\u200B${curCard.desc}`,
                        color: 0xff0000,
                        fields: [
                            {
                                name: `Type`,
                                value: `\u200B${curCard.type}`,
                                inline: true,
                            },
                            {
                                name: `Special`,
                                value: `\u200B${curCard.special}`,
                                inline: true,
                            },
                            {
                                name: `Criticals`,
                                value: `\u200B${curCard.criticals}`,
                                inline: true,
                            },
                        ],
                        thumbnail: {
                            url: curCard.url,
                        },
                    };
                    curEmbs.push(curEmb);
                    thisPost++;
                    i++;
                }
                if (i > 9) {
                    reply(null, null, curEmbs);
                } else {
                    reply(
                        "To get more specific info on a card, type `" +
                            prefix +
                            "info [ID OF CARD]`. Example: `=info 1234`.",
                        null,
                        curEmbs
                    );
                }
            }
        }
        if (comm.startsWith("info") && In()) {
            let cardId = comm.slice(5, comm.length);
            for (var i = 0; i < goomStorage[msg.author.id].cards.length; i++) {
                if (cardId === goomStorage[msg.author.id].cards[i].id) {
                    let curCard = goomStorage[msg.author.id].cards[i];
                    reply(null, null, [
                        {
                            type: "rich",
                            title: curCard.name + " #" + curCard.id,
                            description: `\u200B${curCard.desc}`,
                            color: 0xff0000,
                            fields: [
                                {
                                    name: `Type`,
                                    value: `\u200B${curCard.type}`,
                                    inline: true,
                                },
                                {
                                    name: `Special`,
                                    value: `\u200B${curCard.special}`,
                                    inline: true,
                                },
                                {
                                    name: `Criticals`,
                                    value: `\u200B${curCard.criticals}`,
                                    inline: true,
                                },
                                {
                                    name: `History`,
                                    value: `Previously owned by ${curCard.history}`,
                                    inline: true,
                                },
                                {
                                    name: "Battle Stats",
                                    value: `Wins: ${curCard.wins}\nLosses: ${curCard.losses}\nDraws: ${curCard.draws}`,
                                    inline: true,
                                },
                            ],
                            thumbnail: {
                                url: curCard.url,
                            },
                        },
                    ]);
                    return;
                }
            }
            reply(
                "Whoops! That card wasn't found in your inventory. Someone else might own it!"
            );
        }
        if (comm.startsWith("newcards") && In()) {
            if (goomStorage[msg.author.id].cards.length === 0) {
                for (var i = 0; i < 8; i++) {
                    let curCard =
                        possibleCards[
                            Math.floor(Math.random() * possibleCards.length)
                        ];
                    curCard.history = [msg.author.tag];
                    let possIds = require("./possIds.json").ids;
                    curCard.id = possIds[0];
                    curCard.wins = 0;
                    curCard.losses = 0;
                    curCard.draws = 0;
                    possIds.splice(0, 1);
                    fs.writeFileSync(
                        "./possIds.json",
                        `{"ids":` + JSON.stringify(possIds) + `}`
                    );
                    goomStorage[msg.author.id].cards.push(curCard);
                }
                reply("You have been granted 8 new cards! Have fun!");
            } else {
                reply("You're not out of cards! You have to run out first!");
            }
        }
        if (comm.startsWith("how")) {
            reply(
                "This is a game based off of the Bowser's Minions sidequest in _Mario & Luigi Superstar Saga + Bowser's Minions_ by Nintendo.\n\nThis menu is for how to play, if you want the commands use `" +
                    prefix +
                    "help`\n\nWhen you start Goomba Squad you get 8 characters, 7 normal ones and 1 captain. Each character has three fields - name, type, and special. The name is who the character is, and they may or may not get an extra point over another character based off of their name. Type can be one of three kinds - Melee, Flying, or Ranged. Melee are characters who attack on the ground. Flying attack from the sky. Ranged throw or shoot projectiles. Melee is strong against Ranged is strong against Flying is strong against Melee. If you are strong against another character, you get another point. Special can be one of _many_ special attacks. The stronger special attack gets another point. At the end of the battle, the player who's character has more points gets to obtain his opponent's character. If at any point you run out of characters to use, a new set of 8 will be generated for you."
            );
        }
        if (comm.startsWith("challenge") && In()) {
            let opp;
            try {
                opp = msg.mentions.users.first();
            } catch (e) {
                reply(
                    "Whoops! You have to ping the user you want to challenge."
                );
                return;
            }
            try {
                if (opp.bot && opp.id !== "966167746243076136") {
                    reply("Whoops! You can't play against a bot!");
                    return;
                }
                if (opp.id === msg.author.id) {
                    reply("Whoops! You can't play against yourself!");
                    return;
                }
            } catch (e) {}
            if (opp.id !== "966167746243076136") {
                try {
                    if (goomStorage[opp.id].challenging !== msg.author.id) {
                        goomStorage[msg.author.id].challenging = opp.id;
                        reply(
                            "<@" +
                                opp.id +
                                ">, do you wish to play <@" +
                                msg.author.id +
                                ">? If so, type '=challenge <@" +
                                msg.author.id +
                                ">'. Otherwise, you can type `=noChallenge` or just ignore the challenge."
                        );
                        save();
                    } else {
                        goomStorage[msg.author.id].challenging = opp.id;
                        goomStorage[opp.id].challenging = msg.author.id;
                        goomStorage[msg.author.id].chosen = null;
                        goomStorage[msg.author.id].postChannel =
                            msg.guild.id + "/" + msg.channel.id;
                        goomStorage[opp.id].chosen = null;
                        goomStorage[opp.id].postChannel =
                            msg.guild.id + "/" + msg.channel.id;
                        reply(
                            "Alright! Check your DMs for further instructions!"
                        );
                        msg.author.send(
                            "Type `=choose [CARD ID]` to pick a card to use! Type `=cards` to see all available cards."
                        );
                        client.users.cache
                            .get(opp.id)
                            .send(
                                "Type `=choose [CARD ID]` to pick a card to use! Type `=cards` to see all available cards."
                            );
                        save();
                    }
                } catch (e) {
                    reply(
                        "Your desired opponent isn't in GoombaSquad yet! Let them know to use `=join` if they'd like to play!"
                    );
                }
            } else {
                reply(
                    "If you'd like to play Single Player mode, type `~singlePlayer [CARD ID]` and I'll play against you! (Playing against me is no risk, no reward)."
                );
            }
        }
        if (comm.startsWith("nochallenge")) {
            reply("Alright, I have cancelled all challenges.");
            goomStorage[msg.author.id].challenging = null;
            goomSave();
        }
        if (
            comm.startsWith("debug") &&
            msg.author.id === "949401296404905995"
        ) {
            eval(msg.content.slice(6, msg.content.length));
        }
        if (comm.startsWith("choose") && In()) {
            if (goomStorage[msg.author.id].challenging) {
                let chosenId = comm.slice("7", comm.length);
                let foundACard = false;
                for (
                    var i = 0;
                    i < goomStorage[msg.author.id].cards.length;
                    i++
                ) {
                    if (goomStorage[msg.author.id].cards[i].id === chosenId) {
                        reply(
                            "Alright! I'll use " +
                                goomStorage[msg.author.id].cards[i].name +
                                " #" +
                                chosenId
                        );
                        foundACard = true;
                        goomStorage[msg.author.id].chosen =
                            goomStorage[msg.author.id].cards[i];
                    }
                }
                if (!foundACard) {
                    reply(
                        "Whoops! I didn't find that card in your inventory. Type `=cards` to see a list of available cards."
                    );
                } else if (
                    goomStorage[goomStorage[msg.author.id].challenging]
                        .chosen !== null
                ) {
                    let result = battle(
                        goomStorage[msg.author.id].chosen,
                        goomStorage[goomStorage[msg.author.id].challenging]
                            .chosen
                    );
                    let g = client.guilds.cache.get(
                        goomStorage[msg.author.id].postChannel.split("/")[0]
                    );
                    let c = g.channels.cache.get(
                        goomStorage[msg.author.id].postChannel.split("/")[1]
                    );
                    let curCard = goomStorage[msg.author.id].chosen;
                    let emb1 = {
                        type: "rich",
                        title: curCard.name + " #" + curCard.id,
                        description: `\u200B${curCard.desc}`,
                        color: 0xff0000,
                        fields: [
                            {
                                name: `Type`,
                                value: `\u200B${curCard.type}`,
                                inline: true,
                            },
                            {
                                name: `Special`,
                                value: `\u200B${curCard.special}`,
                                inline: true,
                            },
                            {
                                name: `Criticals`,
                                value: `\u200B${curCard.criticals}`,
                                inline: true,
                            },
                        ],
                        thumbnail: {
                            url: curCard.url,
                        },
                    };
                    curCard =
                        goomStorage[goomStorage[msg.author.id].challenging]
                            .chosen;
                    let emb2 = {
                        type: "rich",
                        title: curCard.name + " #" + curCard.id,
                        description: `\u200B${curCard.desc}`,
                        color: 0xff0000,
                        fields: [
                            {
                                name: `Type`,
                                value: `\u200B${curCard.type}`,
                                inline: true,
                            },
                            {
                                name: `Special`,
                                value: `\u200B${curCard.special}`,
                                inline: true,
                            },
                            {
                                name: `Criticals`,
                                value: `\u200B${curCard.criticals}`,
                                inline: true,
                            },
                        ],
                        thumbnail: {
                            url: curCard.url,
                        },
                    };
                    async function resultSend(txt, attachments, embs, ava) {
                        let webhooks = await c.fetchWebhooks();
                        let webhook = webhooks.find((wh) => wh.token);

                        if (!webhook) {
                            c.createWebhook("GoombaSquad", {
                                avatar: "https://raw.githubusercontent.com/SMOMusic/Kestron-Tron/main/MQCaptainGoomba.png",
                            });
                            c.send({
                                content: "Channel readied.\n" + txt,
                                files: attachments,
                                embeds: embs,
                            });
                            return;
                        }
                        await webhook.send({
                            content: txt,
                            files: attachments,
                            embeds: embs,
                            username: "GoombaSquad",
                            avatarURL:
                                ava ||
                                "https://raw.githubusercontent.com/SMOMusic/Kestron-Tron/main/MQCaptainGoomba.png",
                        });
                    }
                    let userData = {
                        thisUser: msg.author.username,
                        thatUser: client.users.cache.get(
                            goomStorage[msg.author.id].challenging
                        ).username,
                    };
                    if (result === 0) {
                        //This player
                        reply("Congratulations! You won!");
                        client.users.cache
                            .get(goomStorage[msg.author.id].challenging)
                            .send(
                                "Too bad, your opponent won. If you are out of cards, type `=newCards` to get a new set."
                            );
                        resultSend(
                            userData.thisUser +
                                " won against " +
                                userData.thatUser +
                                " using " +
                                goomStorage[msg.author.id].chosen.name +
                                ". " +
                                userData.thatUser +
                                " will now forfeit " +
                                goomStorage[
                                    goomStorage[msg.author.id].challenging
                                ].chosen.name +
                                ".",
                            null,
                            [emb1, emb2]
                        );
                        let forfeitCard =
                            goomStorage[goomStorage[msg.author.id].challenging]
                                .chosen;
                        forfeitCard.history.push(msg.author.tag);
                        forfeitCard.losses++;
                        goomStorage[msg.author.id].cards.push(forfeitCard);
                        for (
                            var i = 0;
                            i < goomStorage[msg.author.id].cards.length;
                            i++
                        ) {
                            if (
                                goomStorage[msg.author.id].cards[i].id ===
                                goomStorage[msg.author.id].chosen.id
                            ) {
                                goomStorage[msg.author.id].cards[i].wins++;
                            }
                        }
                        for (
                            var i = 0;
                            i <
                            goomStorage[goomStorage[msg.author.id].challenging]
                                .cards.length;
                            i++
                        ) {
                            if (
                                goomStorage[
                                    goomStorage[msg.author.id].challenging
                                ].cards[i].id ===
                                goomStorage[
                                    goomStorage[msg.author.id].challenging
                                ].chosen.id
                            ) {
                                goomStorage[
                                    goomStorage[msg.author.id].challenging
                                ].cards.splice(i, 1);
                            }
                        }
                    } else if (result === 1) {
                        //The other player
                        reply(
                            "Too bad, your opponent won. If you are out of cards, type `=newCards` to get a new set."
                        );
                        client.users.cache
                            .get(goomStorage[msg.author.id].challenging)
                            .send("Congratulations! You won!");
                        resultSend(
                            userData.thatUser +
                                " won against " +
                                userData.thisUser +
                                " using " +
                                goomStorage[
                                    goomStorage[msg.author.id].challenging
                                ].chosen.name +
                                ". " +
                                userData.thisUser +
                                " will now forfeit " +
                                goomStorage[msg.author.id].chosen.name +
                                ".",
                            null,
                            [emb1, emb2]
                        );
                        let forfeitCard = goomStorage[msg.author.id].chosen;
                        forfeitCard.history.push(
                            client.users.cache.get(
                                goomStorage[msg.author.id].challenging
                            ).tag
                        );
                        forfeitCard.losses++;
                        goomStorage[
                            goomStorage[msg.author.id].challenging
                        ].cards.push(forfeitCard);
                        for (
                            var i = 0;
                            i <
                            goomStorage[goomStorage[msg.author.id].challenging]
                                .cards.length;
                            i++
                        ) {
                            if (
                                goomStorage[
                                    goomStorage[msg.author.id].challenging
                                ].cards[i].id ===
                                goomStorage[
                                    goomStorage[msg.author.id].challenging
                                ].chosen.id
                            ) {
                                goomStorage[
                                    goomStorage[msg.author.id].challenging
                                ].cards[i].wins++;
                            }
                        }
                        for (
                            var i = 0;
                            i < goomStorage[msg.author.id].cards.length;
                            i++
                        ) {
                            if (
                                goomStorage[msg.author.id].cards[i].id ===
                                goomStorage[msg.author.id].chosen.id
                            ) {
                                goomStorage[msg.author.id].cards.splice(i, 1);
                            }
                        }
                    } else {
                        //Draw
                        reply("Neither of you won! It was a tie!");
                        client.users.cache
                            .get(goomStorage[msg.author.id].challenging)
                            .send("Neither of you won! It was a tie!");
                        resultSend(
                            userData.thisUser +
                                " and " +
                                userData.thatUser +
                                " tied!\n" +
                                userData.thisUser +
                                " used " +
                                goomStorage[msg.author.id].chosen.name +
                                ", and " +
                                userData.thatUser +
                                " used " +
                                goomStorage[
                                    goomStorage[msg.author.id].challenging
                                ].chosen.name +
                                ".",
                            null,
                            [emb1, emb2]
                        );
                        for (
                            var i = 0;
                            i <
                            storage[storage[msg.author.id].challenging].cards
                                .length;
                            i++
                        ) {
                            if (
                                goomStorage[
                                    goomStorage[msg.author.id].challenging
                                ].cards[i].id ===
                                goomStorage[
                                    goomStorage[msg.author.id].challenging
                                ].chosen.id
                            ) {
                                goomStorage[
                                    goomStorage[msg.author.id].challenging
                                ].cards[i].draws++;
                            }
                        }
                        for (
                            var i = 0;
                            i < goomStorage[msg.author.id].cards.length;
                            i++
                        ) {
                            if (
                                goomStorage[msg.author.id].cards[i].id ===
                                goomStorage[msg.author.id].chosen.id
                            ) {
                                goomStorage[msg.author.id].cards[i].draws++;
                            }
                        }
                    }
                    goomStorage[msg.author.id].chosen = null;
                    goomStorage[msg.author.id].postChannel = null;
                    goomStorage[goomStorage[msg.author.id].challenging].chosen =
                        null;
                    goomStorage[
                        goomStorage[msg.author.id].challenging
                    ].challenging = null;
                    goomStorage[
                        goomStorage[msg.author.id].challenging
                    ].postChannel = null;
                    goomStorage[msg.author.id].challenging = null;
                    save();
                }
            } else {
                reply(
                    "You're not in a challenge! Type `=challenge [@ OPPONENT]` to challenge someone!"
                );
            }
        }
        if (comm.startsWith("singleplayer") && In()) {
            let cardId = comm.slice(13, comm.length);
            for (var i = 0; i < goomStorage[msg.author.id].cards.length; i++) {
                if (cardId === goomStorage[msg.author.id].cards[i].id) {
                    let curCard = goomStorage[msg.author.id].cards[i];
                    let myCard =
                        enemyCards[
                            Math.floor(Math.random() * enemyCards.length)
                        ];
                    let result = battle(curCard, myCard);
                    let res = "";
                    switch (result) {
                        default:
                            res = "We tied!";
                            goomStorage[msg.author.id].cards[i].draws++;
                            break;
                        case 0:
                            res = "You won!";
                            goomStorage[msg.author.id].cards[i].wins++;
                            break;
                        case 1:
                            res = "You lost!";
                            goomStorage[msg.author.id].cards[i].losses++;
                            break;
                    }
                    save();
                    let emb1 = {
                        type: "rich",
                        title: curCard.name + " #" + curCard.id,
                        description: `\u200B${curCard.desc}`,
                        color: 0xff0000,
                        fields: [
                            {
                                name: `Type`,
                                value: `\u200B${curCard.type}`,
                                inline: true,
                            },
                            {
                                name: `Special`,
                                value: `\u200B${curCard.special}`,
                                inline: true,
                            },
                            {
                                name: `Criticals`,
                                value: `\u200B${curCard.criticals}`,
                                inline: true,
                            },
                        ],
                        thumbnail: {
                            url: curCard.url,
                        },
                    };
                    let emb2 = {
                        type: "rich",
                        title: myCard.name,
                        description: `\u200B${myCard.desc}`,
                        color: 0xff0000,
                        fields: [
                            {
                                name: `Type`,
                                value: `\u200B${myCard.type}`,
                                inline: true,
                            },
                            {
                                name: `Special`,
                                value: `\u200B${myCard.special}`,
                                inline: true,
                            },
                            {
                                name: `Criticals`,
                                value: `\u200B${myCard.criticals}`,
                                inline: true,
                            },
                        ],
                        thumbnail: {
                            url: myCard.url,
                        },
                    };
                    reply(res, null, [emb1, emb2]);
                    return;
                }
            }
            reply(
                "Whoops! That card wasn't found in your inventory. Someone else might own it!"
            );
        }
    }

    //Counting
    if (msg.content.startsWith("~")) {
        return;
    }
    try {
        if (msg.channel.id === cData[cOn].countChannel) {
            let str = msg.content.toLowerCase();
            if (str.match(/\d+/g).length > 0) {
                var num = Number(str.match(/\d+/g)[0]);
                if (!isNaN(str.charAt(0))) {
                    console.log("Number in message is: " + num);
                } else {
                    console.log("Message does not start with a number");
                }
                if (!isNaN(str.charAt(0))) {
                    if (
                        +num === cData[cOn].nextNum &&
                        cData[cOn].lastPosted !== msg.author.id
                    ) {
                        msg.react("✅");
                        cData[cOn].nextNum++;
                        if (
                            cData[cOn].nextNum === cData[cOn].highestNum &&
                            cData[cOn].legit
                        ) {
                            msg.reply("New high score for this server!");
                            msg.react("🥳");
                        }
                        if (
                            cData[cOn].nextNum - 1 > cData[cOn].highestNum &&
                            cData[cOn].legit
                        ) {
                            cData[cOn].highestNum = cData[cOn].nextNum - 1;
                        }
                        cData[cOn].lastPosted = msg.author.id;
                        cDataUpdate();
                    } else if (cData[cOn].nextNum !== 1) {
                        if (cData[cOn].lastPosted !== msg.author.id) {
                            msg.reply(
                                "Whoops! You messed up the count! The next number to post is 1."
                            );
                            cData[cOn].legit = true;
                        } else {
                            msg.reply(
                                "Whoops! It's not your turn! Next number to post is 1."
                            );
                            cData[cOn].legit = true;
                        }
                        cData[cOn].beenReset = true;
                        cData[cOn].nextNum = 1;
                        cData[cOn].lastPosted = null;
                        cDataUpdate();
                    }
                }
            }
        }
    } catch (e) {}
    goomSave();
});
client.on("messageUpdate", async (oldMsg, newMsg) => {
    try {
        let id = "0";
        try {
            id = newMsg.guild.id;
        } catch (e) {}
        if (id === "0") {
            return;
        }
        let user = newMsg.guild.members.cache.get(newMsg.author.id);
        if (
            storage[id].filter.filter &&
            !user.permissions.has("MANAGE_MESSAGES")
        ) {
            if (newMsg.content.includes("https://discord.gg/")) {
                let found = newMsg.content
                    .match(/https:\/\/discord\.gg\/\w*/i)[0]
                    .split("gg/")[1];
                let didIt = false;
                await fetch("https://discord.com/api/v6/invites/" + found)
                    .then((d) => d.json())
                    .then((d) => {
                        for (
                            var i = 0;
                            i < storage[id].filter.badWords.length;
                            i++
                        ) {
                            if (storage[id].filter.badWords[i] === d.guild.id) {
                                didIt = true;
                            }
                        }
                    })
                    .catch((e) => {});
                if (didIt) {
                    newMsg.reply(
                        "Message by **" +
                            newMsg.author.tag +
                            "** removed due to editing an invite to a server this server has blocked into the message."
                    );
                    newMsg.delete();
                    return;
                }
            }
            for (var i = 0; i < storage[id].filter.badWords.length; i++) {
                let badWordRegex = new RegExp(
                    "(\\b|_)" +
                        storage[id].filter.badWords[i] +
                        "(ing|er|ed|s)?\\b",
                    "ig"
                );
                if (badWordRegex.test(newMsg.content)) {
                    newMsg.reply(
                        `This message by ${newMsg.author.tag}** has been deleted due to a blocked word having been edited into the message after it was sent.`
                    );
                    newMsg.delete();
                    return;
                }
            }
        }
        if (
            storage[id].starboard.active &&
            storage[id].starboard.posted[newMsg.id]
        ) {
            newMsg.guild.channels.cache
                .get(storage[id].starboard.channel)
                .messages.fetch(storage[id].starboard.posted[newMsg.id])
                .then(async (d) => {
                    let starred = newMsg;
                    let starEmbed = new MessageEmbed()
                        .setColor(starred.author.displayHexColor)
                        .setTitle("(Jump to message)")
                        .setURL(
                            "https://www.discord.com/channels/" +
                                starred.guild.id +
                                "/" +
                                starred.channel.id +
                                "/" +
                                starred.id
                        )
                        .setAuthor({
                            name: starred.author.username,
                            iconURL: "" + starred.author.displayAvatarURL(),
                            url:
                                "https://discord.com/users/" +
                                starred.author.id,
                        })
                        .setDescription(starred.content)
                        .setTimestamp(new Date(starred.createdTimestamp))
                        .setFooter({
                            text: newMsg.channel.name,
                            iconURL:
                                "https://cdn.discordapp.com/attachments/1052328722860097538/1069496476687945748/141d49436743034a59dec6bd5618675d.png",
                        })
                        .setImage(
                            starred.attachments.first()
                                ? starred.attachments.first().proxyURL
                                : ""
                        ); //.setImage(thin);
                    let starFiles = [];
                    let i = 0;
                    starred.attachments.forEach((attached) => {
                        let url = attached.proxyURL.toLowerCase();
                        if (
                            i !== 0 ||
                            (!url.includes("jpg") &&
                                !url.includes("png") &&
                                !url.includes("jpeg") &&
                                !url.includes("gif"))
                        ) {
                            starFiles.push(attached.proxyURL);
                        }
                        i++;
                    });
                    await d
                        .edit({
                            content:
                                "**" +
                                storage.starMessages[
                                    Math.floor(
                                        Math.random() *
                                            storage.starMessages.length
                                    )
                                ].replaceAll(
                                    "@",
                                    starred.author.displayName
                                        ? starred.author.displayName
                                        : starred.author.username
                                ) +
                                "**",
                            embeds: [starEmbed],
                            files: starFiles,
                        })
                        .then((d) => {
                            storage[id].starboard.posted[starred.id] = d.id;
                        });
                });
        }
    } catch (e) {
        console.log(e);
    }
});
client.on("messageDelete", async (msg) => {
    try {
        let id = "0";
        try {
            id = msg.guild.id;
        } catch (e) {}
        if (id === "0") {
            return;
        }
        if (
            storage[id].starboard.active &&
            storage[id].starboard.posted[msg.id]
        ) {
            msg.guild.channels.cache
                .get(storage[id].starboard.channel)
                .messages.fetch(storage[id].starboard.posted[msg.id])
                .then((d) =>
                    d.edit({
                        content:
                            "Original post by **" +
                            msg.author.tag +
                            "** was deleted",
                        embeds: [],
                    })
                );
        }
    } catch (e) {
        console.log(e);
    }
});
client.on("messageReactionAdd", async (react, user) => {
    try {
        let starred = await react.message.channel.messages.fetch(
            react.message.id
        );
        let id = "0";
        try {
            id = starred.guild.id;
        } catch (e) {}
        if (id === "0") {
            return;
        }
        /*
        {
      "type": "rich",
      "title": `(Jump to message)`,
      "description": `This is so cool! I love it!`,
      "color": 0xff0000,
      "image": {
        "url": `https://media.discordapp.net/attachments/1052328722860097538/1069428465574617138/image.png`,
        "height": 0,
        "width": 0
      },
      "author": {
        "name": `Bob`,
        "url": `https://discord.com/users/949401296404905995`,
        "icon_url": `https://media.discordapp.net/attachments/1052328722860097538/1069428465574617138/image.png`
      },
      "footer": {
        "text": `Each message with more than 5 ⭐ gets posted here!`
      },
      "url": `https://discord.com/channels/810540153294684192/810540153294684195/1069492014854451270`
    }
        */
        if (
            storage[id].starboard.posted[starred.id] === null ||
            storage[id].starboard.posted[starred.id] === undefined
        ) {
            try {
                let count = starred.reactions.cache.get(
                    storage[id].starboard.emote.includes("<:")
                        ? storage[id].starboard.emote
                              .split(":")[2]
                              .split(">")[0]
                        : storage[id].starboard.emote
                ).count;
                if (
                    count >= storage[id].starboard.threshold &&
                    storage[id].starboard.active &&
                    storage[id].starboard.channel !== starred.channel.id &&
                    !storage[id].starboard.posted[react.message.id]
                ) {
                    storage[id].starboard.posted[starred.id] = "temp";
                    let starEmbed = new MessageEmbed()
                        .setColor(react.message.author.displayHexColor)
                        .setTitle("(Jump to message)")
                        .setURL(
                            "https://www.discord.com/channels/" +
                                react.message.guild.id +
                                "/" +
                                react.message.channel.id +
                                "/" +
                                react.message.id
                        )
                        .setAuthor({
                            name: react.message.author.username,
                            iconURL:
                                "" + react.message.author.displayAvatarURL(),
                            url:
                                "https://discord.com/users/" +
                                react.message.author.id,
                        })
                        .setDescription(react.message.content)
                        .setTimestamp(new Date(react.message.createdTimestamp))
                        .setFooter({
                            text: react.message.channel.name,
                            iconURL:
                                "https://cdn.discordapp.com/attachments/1052328722860097538/1069496476687945748/141d49436743034a59dec6bd5618675d.png",
                        })
                        .setImage(
                            react.message.attachments.first()
                                ? react.message.attachments.first().proxyURL
                                : ""
                        ); //.setImage(thin);
                    let starFiles = [];
                    let i = 0;
                    react.message.attachments.forEach((attached) => {
                        let url = attached.proxyURL.toLowerCase();
                        if (
                            i !== 0 ||
                            (!url.includes("jpg") &&
                                !url.includes("png") &&
                                !url.includes("jpeg") &&
                                !url.includes("gif"))
                        ) {
                            starFiles.push(attached.proxyURL);
                        }
                        i++;
                    });
                    await starred.guild.channels.cache
                        .get(storage[id].starboard.channel)
                        .send({
                            content:
                                "**" +
                                storage.starMessages[
                                    Math.floor(
                                        Math.random() *
                                            storage.starMessages.length
                                    )
                                ].replaceAll(
                                    "@",
                                    starred.author.displayName
                                        ? starred.author.displayName
                                        : starred.author.username
                                ) +
                                "**",
                            embeds: [starEmbed],
                            files: starFiles,
                        })
                        .then((d) => {
                            storage[id].starboard.posted[starred.id] = d.id;
                        });
                }
            } catch (e) {}
        }
        save();
    } catch (e) {
        console.log(e);
    }
    if (user.bot || !store.ids.includes(react.message.id)) {
        return;
    }
    guild = react.message.guild;
    member = guild.members.cache.find((member) => member.id === user.id);
    let n = react._emoji.name;
    for (var i = 0; i < store.guilds.length; i++) {
        if (store.guilds[i] === react.message.guild.id) {
            u = i;
        }
    }
    for (var i = 0; i < store.emotes[u].length; i++) {
        if (store.emotes[u][i] === n) {
            try {
                role = react.message.guild.roles.cache.find(
                    (r) => r.name === store.names[u][i]
                );
                member.roles.add(role);
                console.log(
                    "Added " +
                        store.emotes[u][i] +
                        " | " +
                        store.names[u][i] +
                        " to " +
                        member.user.username
                );
            } catch (e) {
                role = react.message.guild.roles.find(
                    (r) => r.name === store.names[u][i]
                );
                member.roles.add(role);
                console.log(
                    "Added " +
                        store.emotes[u][i] +
                        " | " +
                        store.names[u][i] +
                        " to " +
                        member.user.username
                );
            }
        }
    }
});
client.on("messageReactionRemove", async (react, user) => {
    if (user.bot || !store.ids.includes(react.message.id)) {
        return;
    }
    guild = react.message.guild;
    member = guild.members.cache.find((member) => member.id === user.id);
    let n = react._emoji.name;
    for (var i = 0; i < store.guilds.length; i++) {
        if (store.guilds[i] === react.message.guild.id) {
            u = i;
        }
    }
    for (var i = 0; i < store.emotes[u].length; i++) {
        if (store.emotes[u][i] === n) {
            role = react.message.guild.roles.cache.find(
                (r) => r.name === store.names[u][i]
            );
            member.roles.remove(role);
            console.log(
                "Removed " +
                    store.emotes[u][i] +
                    " | " +
                    store.names[u][i] +
                    " from " +
                    member.user.username
            );
        }
    }
});
client.on("interactionCreate", async (cmd) => {
    try {
        let id = "0";
        try {
            id = cmd.guild.id;
        } catch (e) {}
        async function clean(str) {
            if (id !== "0" /*&&!perms("MANAGE_MESSAGES",false)*/) {
                if (str.includes("https://discord.gg/")) {
                    let found = str
                        .match(/https:\/\/discord\.gg\/\w*/i)[0]
                        .split("gg/")[1];
                    let didIt = false;
                    await fetch("https://discord.com/api/v6/invites/" + found)
                        .then((d) => d.json())
                        .then((d) => {
                            for (
                                var i = 0;
                                i < storage[id].filter.badWords.length;
                                i++
                            ) {
                                if (
                                    storage[id].filter.badWords[i] ===
                                    d.guild.id
                                ) {
                                    didIt = true;
                                }
                            }
                        })
                        .catch((e) => {});
                    if (didIt && storage[id].filter.censor) {
                        cmd.reply({
                            content:
                                "Sorry **" +
                                msg.author.tag +
                                "**! This server has blocked that server.",
                            ephemeral: true,
                        });
                        return false;
                    }
                }
                let temp = str.replace(/(?<=\b\S)\s(?=\S\b)/g, "");
                let temp2 = str.replace(/(?<=\b\S)\s(?=\S\b)/g, "");
                let replacements = [
                    "!1i",
                    "@&a",
                    "#h",
                    "$s",
                    "^+t",
                    "(c",
                    "6b",
                ];
                for (var i = 0; i < replacements.length; i++) {
                    let placements = replacements[i].split("/");
                    for (var j = 0; j < placements.length - 1; j++) {
                        temp = temp.replaceAll(
                            placements[j],
                            placements[placements.length - 1]
                        );
                        temp2 = temp2.replaceAll(
                            placements[j],
                            placements[placements.length - 1]
                        );
                    }
                }
                for (var i = 0; i < storage[id].filter.badWords.length; i++) {
                    let badWordRegex = new RegExp(
                        "(\\b|_)" +
                            storage[id].filter.badWords[i] +
                            "(ing|er|ed|s)?\\b",
                        "ig"
                    );
                    temp = temp.replace(badWordRegex, "[\\_]");
                }
                if (temp !== temp2) {
                    cmd.reply({
                        content: "I do not support such language.",
                        ephemeral: true,
                    });
                    return false;
                }
            }
        }
        function perms(perm, ret, me) {
            let tof;
            if (id === "0" && !me) {
                if (ret) {
                    cmd.reply("Whoops! Can't do that in DMs!");
                }
                return cmd.member.id === "949401296404905995";
            } else if (id === "0") {
                cmd.reply("Whoops! I can't do that in DMs!");
                return false;
            }
            if (perm !== "Kestron") {
                tof =
                    cmd.member.permissions.has(perm) ||
                    cmd.member.id === "949401296404905995";
            } else {
                tof = cmd.member.id === "949401296404905995";
            }
            if (ret && !tof && !me) {
                cmd.reply(
                    "Whoops! This command needs you to have the following permission: `" +
                        perm +
                        "`."
                );
            }
            if (me) {
                try {
                    tof = cmd.guild.permissions.me.has(perm);
                    if (ret && !tof) {
                        cmd.reply(
                            "Whoops! I don't have suifficient permissions for this action! I need the `" +
                                perm +
                                "` permission to do that."
                        );
                    }
                } catch (e) {
                    return false;
                }
            }
            return tof;
        }
        try {
            if (!storage[id].allocated) {
                callHome("Allocated default values to " + id);
                storage[id] = defaultGuild;
            }
        } catch (e) {
            storage[id] = defaultGuild;
        }
        if (cmd.isButton()) {
            switch (cmd.customId) {
                case "filterConfirmation":
                    if (storage[id].filter.badWords.length > 0) {
                        cmd.user
                            .send(
                                "Here is the requested filter list for " +
                                    cmd.guild.name +
                                    ".\n\n||" +
                                    storage[id].filter.badWords.join("||, ||") +
                                    "||"
                            )
                            .catch((e) => {});
                        cmd.deferUpdate();
                    } else {
                        cmd.reply("There aren't any words in the filter!");
                    }
                    break;
                case "racMove":
                    let moveModal = new Modal()
                        .setCustomId("moveModal")
                        .setTitle("Rows & Columns Move");
                    let moveModalInput = new Discord.TextInputComponent()
                        .setCustomId("moveMade")
                        .setLabel("Where would you like to move? (Example: AC)")
                        .setStyle("SHORT");
                    let row = new MessageActionRow().addComponents(
                        moveModalInput
                    );
                    moveModal.addComponents(row);
                    await cmd.showModal(moveModal);
                    break;
                case "racJoin":
                    readRACBoard(cmd.message.content);
                    for (var i = 0; i < rac.players.length; i++) {
                        if (rac.players[i] === cmd.member.id) {
                            cmd.reply({
                                content: "You can't join more than once!",
                                ephemeral: true,
                            });
                            return;
                        }
                    }
                    rac.players.push(cmd.member.id);
                    if (rac.players.length > rac.icons.length) {
                        cmd.reply({
                            content:
                                "Whoops! You've hit the limit to the amount of players! I don't have any more symbols to use.",
                            ephemeral: true,
                        });
                        return;
                    }
                    if (getRACBoard().length > 1999) {
                        rac.players.splice(rac.players.length - 1, 1);
                        cmd.reply({
                            content:
                                "Sorry! Sadly the board can't handle any more players. This is a Discord character limit, and can be resolved by using less rows.",
                            ephemeral: true,
                        });
                        let row = new MessageActionRow()
                            .addComponents(
                                new MessageButton()
                                    .setCustomId("racJoin")
                                    .setLabel("Join Game")
                                    .setStyle("DANGER")
                                    .setDisabled(true)
                            )
                            .addComponents(
                                new MessageButton()
                                    .setCustomId("racMove")
                                    .setLabel("Make a Move")
                                    .setStyle("SUCCESS")
                            );
                        cmd.message.edit({
                            content: getRACBoard(),
                            components: [row],
                        });
                        return;
                    }
                    cmd.update(getRACBoard());
                    break;
            }
            save();
            return;
        }
        if (cmd.isModalSubmit()) {
            let cont = cmd.fields.getTextInputValue("moveMade").toUpperCase();
            readRACBoard(cmd.message.content);
            let foundOne = -1;
            for (var i = 0; i < rac.players.length; i++) {
                if (rac.players[i] === cmd.member.id) {
                    foundOne = i;
                }
            }
            if (foundOne === -1) {
                cmd.reply({
                    content:
                        "I didn't find you in the player list! Use the `Join Game` button first!",
                    ephemeral: true,
                });
                return;
            }
            if (cont.length > 2) {
                cmd.reply({
                    content:
                        "Too many inputs! Just two characters are needed - (Example: AC)",
                    ephemeral: true,
                });
                return;
            }
            if (
                !rac.rowsActive.includes(cont[0]) ||
                !rac.rowsActive.includes(cont[1])
            ) {
                cmd.reply({
                    content: "That's off the board!",
                    ephemeral: true,
                });
                return;
            }
            if (
                Date.now() - +rac.timePlayed < 900000 &&
                cmd.member.id === rac.lastPlayer
            ) {
                console.log(Date.now() + " | " + rac.timePlayed);
                cmd.reply({
                    content:
                        "Too soon! You can make another move after somebody else does OR <t:" +
                        Math.round((rac.timePlayed + 900000) / 1000) +
                        ":R>",
                    ephemeral: true,
                });
                return;
            }
            if (
                rac.board[rac.rowsActive.indexOf(cont[0])][
                    rac.rowsActive.indexOf(cont[1])
                ] !== "-"
            ) {
                cmd.reply({
                    content: "Someone already moved there!",
                    ephemeral: true,
                });
                return;
            }

            rac.lastPlayer = cmd.member.id;
            rac.timePlayed = Date.now();
            rac.board[rac.rowsActive.indexOf(cont[0])][
                rac.rowsActive.indexOf(cont[1])
            ] = rac.icons[foundOne];

            await cmd.update(getRACBoard());

            let foundZero = false;
            for (var i = 0; i < rac.board.length; i++) {
                for (var j = 0; j < rac.board[i].length; j++) {
                    if (rac.board[i][j] === "-") {
                        foundZero = true;
                    }
                }
            }
            if (!foundZero) {
                let row = new MessageActionRow()
                    .addComponents(
                        new MessageButton()
                            .setCustomId("racJoin")
                            .setLabel("Join Game")
                            .setStyle("DANGER")
                            .setDisabled(true)
                    )
                    .addComponents(
                        new MessageButton()
                            .setCustomId("racMove")
                            .setLabel("Make a Move")
                            .setStyle("SUCCESS")
                            .setDisabled(true)
                    );
                cmd.message.edit({ content: tallyRac(), components: [row] });
            }

            return;
        }
        try {
            if (!storage[id].points.allocated) {
                storage[id].points = { allocated: true };
            }
        } catch (e) {
            storage[id] = defaultGuild;
            storage[id].points = { allocated: true };
        }
        switch (cmd.commandName.toLowerCase()) {
            default:
                cmd.reply(
                    `I don't recognize that command - DMed Kestron#9271.`
                );
                callHome(
                    "User tried to use `/" + cmd.commandName + "` to no avail."
                );
                break;
            case "view_points":
                let daId = cmd.options.getUser("who").id || cmd.member.id;
                if (
                    storage[id].points[daId] === null ||
                    storage[id].points[daId] === undefined
                ) {
                    storage[id].points[daId] = 0;
                }
                cmd.reply(
                    `**${cmd.options.getUser("who").tag}** currently has ${
                        storage[id].points[daId]
                    } point${storage[id].points[daId] === 1 ? "" : "s"}.`
                );
                save();
                break;
            case "set_points":
                if (
                    storage[id].points[cmd.options.getUser("who").id] ===
                        null ||
                    storage[id].points[cmd.options.getUser("who").id] ===
                        undefined
                ) {
                    storage[id].points[cmd.options.getUser("who").id] = 0;
                }
                if (perms("MANAGE_MESSAGES", true)) {
                    storage[id].points[cmd.options.getUser("who").id] =
                        cmd.options.getInteger("amount");
                    cmd.reply(
                        "Alright, set **" +
                            cmd.options.getUser("who").tag +
                            "**'s points to " +
                            storage[id].points[cmd.options.getUser("who").id] +
                            "."
                    );
                }
                save();
                break;
            case "add_points":
                if (
                    storage[id].points[cmd.options.getUser("who").id] ===
                        null ||
                    storage[id].points[cmd.options.getUser("who").id] ===
                        undefined
                ) {
                    storage[id].points[cmd.options.getUser("who").id] = 0;
                }
                if (perms("MANAGE_MESSAGES", true)) {
                    storage[id].points[cmd.options.getUser("who").id] +=
                        cmd.options.getInteger("amount");
                    cmd.reply(
                        "Alright, set **" +
                            cmd.options.getUser("who").tag +
                            "**'s points to " +
                            storage[id].points[cmd.options.getUser("who").id] +
                            "."
                    );
                }
                save();
                break;
            case "take_points":
                if (
                    storage[id].points[cmd.options.getUser("who").id] ===
                        null ||
                    storage[id].points[cmd.options.getUser("who").id] ===
                        undefined
                ) {
                    storage[id].points[cmd.options.getUser("who").id] = 0;
                }
                if (perms("MANAGE_MESSAGES", true)) {
                    storage[id].points[cmd.options.getUser("who").id] -=
                        cmd.options.getInteger("amount");
                    cmd.reply(
                        "Alright, set **" +
                            cmd.options.getUser("who").tag +
                            "**'s points to " +
                            storage[id].points[cmd.options.getUser("who").id] +
                            "."
                    );
                }
                save();
                break;
            case "ping":
                cmd.reply(`Replied in ${client.ws.ping} milliseconds.`);
                break;
            case "log":
                cmd.reply("Beta!");
                break;
            case "starboard_config":
                if (perms("MANAGE_MESSAGES", true)) {
                    storage[id].starboard.active =
                        cmd.options.getBoolean("active");
                    storage[id].starboard.channel =
                        cmd.options.getChannel("channel").id;
                    let didIt = false;
                    storage[id].starboard.threshold =
                        cmd.options.getInteger("threshold") ||
                        storage[id].starboard.threshold;
                    if (cmd.options.getString("emoji")) {
                        storage[id].starboard.emote =
                            cmd.options.getString("emoji") ||
                            storage[id].starboard.emoji;
                    }
                    cmd.reply(
                        "Starboard configured" +
                            (didIt
                                ? " - I see you used a custom emoji. Be careful not to make it animated or from another server or only Nitro users can affect Starboard."
                                : "")
                    );
                }
                break;
            case "dne":
                let dneUrl = "";
                if (cmd.options.getString("type") === "person") {
                    dneUrl =
                        "https://this" +
                        cmd.options.getString("type") +
                        "doesnotexist.com/image";
                } else {
                    dneUrl =
                        "https://this" +
                        cmd.options.getString("type") +
                        "doesnotexist.com";
                }
                download
                    .image({
                        url: dneUrl,
                        dest: "./dneImage.jpg",
                    })
                    .then(({ filename }) => {
                        cmd.reply({
                            content:
                                "Credit to <https://this" +
                                cmd.options.getString("type") +
                                "doesnotexist.com> for the image.",
                            files: [filename],
                        });
                    })
                    .catch((e) => err(e));
                break;
            case "meme":
                let num = Math.floor(Math.random() * storage.memes.length);
                if (cmd.options.getInteger("number")) {
                    num = cmd.options.getInteger("number");
                }
                cmd.reply({
                    content: "Meme #" + num,
                    files: [storage.memes[num]],
                });
                break;
            case "save_meme":
                let urls = [];
                cmd.targetMessage.attachments.forEach((a) => {
                    if (a.contentType.includes("image")) {
                        urls.push(a.proxyURL);
                    }
                });
                if (urls.length === 0 && cmd.targetMessage.content.length > 0) {
                    urls.push(cmd.targetMessage.content);
                }
                if (urls.length < 1) {
                    cmd.reply({
                        content: "Whoops! No meme was found!",
                        ephemeral: true,
                    });
                    return;
                }
                if (perms("Kestron")) {
                    cmd.reply("Saved");
                } else {
                    cmd.reply("Submitted for approval");
                }
                break;
            case "wyr":
                fetch(wyrUrl, wyrOptions)
                    .then((d) => d.json())
                    .then(async (d) => {
                        let firstQues =
                            d[0].question.split("Would you rather ")[1];
                        let firstQuest =
                            firstQues[0].toUpperCase() +
                            firstQues
                                .slice(1, firstQues.length)
                                .split(" or ")[0];
                        let nextQues = firstQues.split(" or ")[1];
                        let nextQuest =
                            nextQues[0].toUpperCase() +
                            nextQues.slice(1, nextQues.length).split("?")[0];
                        cmd.reply(
                            "**Would you Rather**\n🅰️: " +
                                firstQuest +
                                "\n🅱️: " +
                                nextQuest
                        ).then((msg) => console.log(msg));
                        let msg = await cmd.fetchReply();
                        msg.react("🅰️").then(msg.react("🅱️"));
                    });
                break;
            case "invite_track":
                if (perms("MANAGE_MESSAGES", true)) {
                    if (!storage[id].invTrackers) {
                        storage[id].invTrackers = {};
                    }
                    storage[id].invTrackers.tracking =
                        cmd.options.getBoolean("track");
                    storage[id].invTrackers.reportChannel =
                        cmd.options.getChannel("report_channel").id;
                    cmd.reply("Invite tracking configured");
                    if (!storage[id].invTrackers.initialized) {
                        let trackers = [];
                        cmd.guild.invites.fetch().then((invites) => {
                            trackers = invites.map((i) => ({
                                invite: "https://discord.gg/" + i.code,
                                uses: i.uses,
                            }));
                        });
                        storage[id].invTrackers.trackedInvs = trackers;
                        storage[id].invTrackers.initialized = true;
                    }
                    save();
                }
                break;
            case "admin_message":
                if (perms("MANAGE_MESSAGES", true)) {
                    cmd.options.getUser("user").send({
                        content:
                            "You were sent a Moderator message by **" +
                            cmd.guild.name +
                            "**",
                        embeds: [
                            {
                                type: "rich",
                                title: cmd.guild.name,
                                description: cmd.options.getString("what"),
                                color: 0xff0000,
                                thumbnail: {
                                    url: cmd.guild.iconURL(),
                                    height: 0,
                                    width: 0,
                                },
                                footer: {
                                    text:
                                        `This message was sent by a moderator of ` +
                                        cmd.guild.name,
                                },
                            },
                        ],
                    });
                    cmd.reply("They have been messaged");
                }
                break;
            case "timeout":
                if (perms("Kestron")) {
                    cmd.reply({
                        content: "Timed out " + cmd.options.getUser("who").tag,
                        ephemeral: true,
                    });
                    cmd.options.getUser("who").timeout(5 * 60 * 1000);
                    cmd.channel.send(
                        "Timed out " +
                            cmd.options.getUser("who") +
                            " for 5 minutes due to detected spam. If this is an error, please contact Kestron#9271."
                    );
                } else {
                    cmd.reply("Not functional yet");
                }
                break;
            case "define":
                if (cmd.options.getBoolean("wiki")) {
                    try {
                        let deferred = await cmd.reply("Loading...");
                        fetch(
                            "https://en.wikipedia.org/wiki/" +
                                cmd.options.getString("what")
                        )
                            .then((d) => d.text())
                            .then((d) => {
                                let html = new JSDOM(d);
                                html = html.window;
                                let daEmbed = {}; /*
                                        try{
                                                cmd.editReply({content:html.document.body.getElementsByClassName("hatnote navigation-not-searchable")[0].textContent});
                                        }catch(e){
                                                cmd.editReply("Fetched, but no disclaimer was present");
                                        }*/
                                if (
                                    html.document
                                        .getElementById("mw-normal-catlinks")
                                        .textContent.toLowerCase()
                                        .includes("disambiguation")
                                ) {
                                    let adds = [];
                                    let toAdd =
                                        html.document.body.getElementsByTagName(
                                            "li"
                                        );
                                    for (
                                        var i = 0;
                                        i < toAdd.length && adds.length < 10;
                                        i++
                                    ) {
                                        if (
                                            toAdd[i].textContent
                                                .toLowerCase()
                                                .includes(
                                                    cmd.options
                                                        .getString("what")
                                                        .toLowerCase()
                                                ) &&
                                            toAdd[i].getElementsByTagName("a")
                                                .length > 0
                                        ) {
                                            adds.push(
                                                "\n - " + toAdd[i].textContent
                                            );
                                        }
                                    }
                                    cmd.editReply(
                                        "`" +
                                            cmd.options.getString("what") +
                                            "` may refer to: ```\n" +
                                            adds +
                                            "```"
                                    );
                                } else {
                                    let response = "Taken from Wikipedia";
                                    try {
                                        response +=
                                            "\n" +
                                            html.document.body.getElementsByClassName(
                                                "hatnote navigation-not-searchable"
                                            )[0].textContent;
                                    } catch (e) {}
                                    let toAdd = "";
                                    try {
                                        toAdd = html.document.body
                                            .getElementsByClassName(
                                                "mw-parser-output"
                                            )[0]
                                            .getElementsByTagName(
                                                "p"
                                            )[1].textContent;
                                    } catch (e) {
                                        toAdd = html.document.body
                                            .getElementsByClassName(
                                                "mw-parser-output"
                                            )[1]
                                            .getElementsByTagName(
                                                "p"
                                            )[1].textContent;
                                    }
                                    cmd.editReply({
                                        content: response,
                                        embeds: [
                                            {
                                                type: "rich",
                                                title:
                                                    `Wikipedia Article for ` +
                                                    cmd.options.getString(
                                                        "what"
                                                    ),
                                                description: toAdd,
                                                color: 0xff0000,
                                                thumbnail: {
                                                    url:
                                                        "https:" +
                                                        html.document
                                                            .getElementsByClassName(
                                                                "infobox-image"
                                                            )[0]
                                                            .getElementsByTagName(
                                                                "img"
                                                            )[0].src,
                                                    height: 0,
                                                    width: 0,
                                                },
                                                footer: {
                                                    text: `Wikipedia`,
                                                    icon_url: `https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Black_W_for_promotion.png/142px-Black_W_for_promotion.png`,
                                                },
                                                url:
                                                    "https://en.wikipedia.org/wiki/" +
                                                    encodeURIComponent(
                                                        cmd.options.getString(
                                                            "what"
                                                        )
                                                    ),
                                            },
                                        ],
                                    });
                                }
                            })
                            .catch((e) => {
                                cmd.editReply("No wikipedia page found!");
                            });
                    } catch (e) {
                        try {
                            cmd.reply("No wikipedia page found");
                        } catch (e) {
                            cmd.editReply("No wikipedia page found");
                        }
                    }
                } else {
                    fetch(
                        "https://api.dictionaryapi.dev/api/v2/entries/en/" +
                            cmd.options.getString("what")
                    )
                        .then((d) => d.json())
                        .then((d) => {
                            console.log(d);
                            d = d[0];
                            let defs = [];
                            for (var i = 0; i < d.meanings.length; i++) {
                                for (
                                    var j = 0;
                                    j < d.meanings[i].definitions.length;
                                    j++
                                ) {
                                    defs.push({
                                        name:
                                            "Type: " +
                                            d.meanings[i].partOfSpeech,
                                        value:
                                            d.meanings[i].definitions[j]
                                                .definition +
                                            (d.meanings[i].definitions[j]
                                                .example !== undefined &&
                                            d.meanings[i].definitions[j]
                                                .example !== null &&
                                            d.meanings[i].definitions[j].example
                                                .length > 0
                                                ? "\nExample: " +
                                                  d.meanings[i].definitions[j]
                                                      .example
                                                : ""),
                                        inline: true,
                                    });
                                }
                            }
                            cmd.reply({
                                embeds: [
                                    {
                                        type: "rich",
                                        title: "Definition of " + d.word,
                                        description: d.origin,
                                        color: 0xff0000,
                                        fields: defs,
                                        footer: {
                                            text: d.phonetic,
                                        },
                                    },
                                ] /*,files:[d.phonetics[0].audio]*/,
                            });
                        })
                        .catch((e) => {
                            cmd.reply("Whoops! Definition not found!");
                            console.log(e);
                        });
                }
                break;
            case "log_config":
                if (perms("MANAGE_MESSAGES", true)) {
                    cmd.reply("Log Events Updated");
                    function temp(logger, where) {
                        if (logger !== undefined && logger !== null) {
                            storage[id].logs[where] = logger;
                        }
                    }
                    temp(cmd.options.getBoolean("log"), "log");
                    temp(cmd.options.getChannel("channel").id, "channel");
                    temp(cmd.options.getBoolean("user_joined"), "userJoins");
                    temp(cmd.options.getBoolean("role_added"), "roleChanges");
                    temp(
                        cmd.options.getBoolean("message_deleted"),
                        "msgDelete"
                    );
                    temp(cmd.options.getBoolean("message_edited"), "msgEdit");
                    temp(
                        cmd.options.getBoolean("channel_created"),
                        "channelCreate"
                    );
                    temp(
                        cmd.options.getBoolean("channel_edited"),
                        "channelEdit"
                    );
                    temp(cmd.options.getBoolean("user_edited"), "userEdit");
                    temp(cmd.options.getBoolean("server_edited"), "serverEdit");
                }
                break;
            case "no_swear":
                if (perms("MANAGE_MESSAGES", true)) {
                    let responseToGive = "";
                    if (
                        cmd.options
                            .getString("bad_word")
                            .includes("https://discord.gg/")
                    ) {
                        await fetch(
                            "https://discord.com/api/v6/invites/" +
                                cmd.options
                                    .getString("bad_word")
                                    .split(".gg/")[1]
                        )
                            .then((d) => d.json())
                            .then((d) => {
                                storage[id].filter.badWords.push(d.guild.id);
                                console.log(d.guild.id);
                                responseToGive =
                                    "\n\nI have detected that you blocked a server invite. I will now block any future invites to the same server as well. Note: to unblock this server, you will need to use `/re_swear " +
                                    d.guild.id +
                                    "`";
                            })
                            .catch((e) => {});
                    }
                    responseToGive =
                        "Okay, I added ||<" +
                        cmd.options.getString("bad_word") +
                        ">|| to the filter for this server." +
                        responseToGive;
                    if (!storage[id].filter.filter) {
                        responseToGive +=
                            "\n\nI see you don't have the filter enabled at the moment. If you want me to filter this word, use `/filter_config` to set it up.";
                    }
                    cmd.reply(responseToGive);
                    storage[id].filter.badWords.push(
                        cmd.options.getString("bad_word").toLowerCase()
                    );
                    save();
                }
                break;
            case "re_swear":
                if (perms("MANAGE_MESSAGES", true)) {
                    let foundWord = false;
                    for (
                        var i = storage[id].filter.badWords.length - 1;
                        i > -1;
                        i--
                    ) {
                        if (
                            cmd.options.getString("bad_word").toLowerCase() ===
                            storage[id].filter.badWords[i]
                        ) {
                            foundWord = true;
                            storage[id].filter.badWords.splice(i, 1);
                        }
                    }
                    if (foundWord) {
                        cmd.reply(
                            "Removed ||" +
                                cmd.options.getString("bad_word") +
                                "|| from the filter."
                        );
                    } else {
                        cmd.reply(
                            "That word was not found in the filter - if you need to check which words are being filtered, type `/view_filter`."
                        );
                    }
                }
                break;
            case "view_filter":
                if (storage[id].filter.badWords.length > 0) {
                    /*
                                if(storage[cmd.user.id].filterConfirm){
                                        storage[cmd.user.id].filterConfirm=false;
                                        cmd.reply("I have DMed you the filter.");
                                        cmd.user.send("Here is the requested filter list for "+cmd.guild.name+".\n\n||"+storage[id].filter.badWords.join("||, ||")+"||");
                                }
                                else{
                                        storage[cmd.user.id].filterConfirm=true;
                                        cmd.reply("Warning! The list that follows _may_ be very dirty. Please confirm you would like to see this list by using the command again.");
                                }*/
                    let row = new MessageActionRow().addComponents(
                        new MessageButton()
                            .setCustomId("filterConfirmation")
                            .setLabel("View List")
                            .setStyle("DANGER")
                    );
                    cmd.reply({
                        content:
                            "Warning! The list that follows _could_ be very dirty.",
                        components: [row],
                    });
                } else {
                    cmd.reply(
                        "There are no bad words in the filter for this server!"
                    );
                }
                break;
            case "filter_config":
                if (perms("MANAGE_MESSAGES", true)) {
                    cmd.reply(
                        "Updated filter configuration. To add words to the filter, use `/no_swear`"
                    );
                    function temp(logger, where) {
                        if (logger !== undefined && logger !== null) {
                            storage[id].filter[where] = logger;
                        }
                    }
                    temp(cmd.options.getBoolean("filter"), "filter");
                    temp(cmd.options.getBoolean("censor"), "censor");
                }
                break;
            case "story_config":
                if (perms("MANAGE_MESSAGES", true)) {
                    storage[id].stories.active =
                        cmd.options.getBoolean("story_active");
                    storage[id].stories.channel =
                        cmd.options.getChannel("story_channel").id;
                    storage[id].stories.announceChannel =
                        cmd.options.getChannel("announcement_channel").id;
                    cmd.reply("Configuration complete");
                }
                break;
            case "translate":
                try {
                    let settings = { to: "en" };
                    if (cmd.options.getString("language_to")) {
                        settings.to = cmd.options.getString("language_to");
                    }
                    if (cmd.options.getString("language_from")) {
                        settings.from = cmd.options.getString("language_from");
                    } else {
                        settings.from = detect.detect(
                            cmd.options.getString("what")
                        )[0][0];
                        console.log(settings.from);
                    }
                    let tr = await translate(
                        cmd.options.getString("what"),
                        settings
                    );
                    cmd.reply("Attempted to translate```\n" + tr + "```");
                } catch (e) {
                    try {
                        let settings = { to: "en", from: "zh" };
                        if (cmd.options.getString("language_to")) {
                            settings.to = cmd.options.getString("language_to");
                        }
                        let tr = await translate(
                            cmd.options.getString("what"),
                            settings
                        );
                        cmd.reply("Attempted to translate```\n" + tr + "```");
                    } catch (e) {
                        cmd.reply(
                            "Something went wrong. If autodetecting, try specifying the language it's in."
                        );
                    }
                }
                break;
            case "translatemessage":
                try {
                    let settings = { to: "en" };
                    settings.from = detect.detect(
                        cmd.targetMessage.content
                    )[0][0];
                    let tr = await translate(
                        cmd.targetMessage.content,
                        settings
                    );
                    cmd.reply("Attempted to translate```\n" + tr + "```");
                } catch (e) {
                    try {
                        let settings = { to: "en", from: "zh" };
                        let tr = await translate(
                            cmd.targetMessage.content,
                            settings
                        );
                        cmd.reply("Attempted to translate```\n" + tr + "```");
                    } catch (e) {
                        cmd.reply(
                            "I was unable to detect the language the message is in. Try using /translate instead, and specify the language."
                        );
                    }
                }
                break;
            case "join_story":
                for (var i = 0; i < storage[id].stories.authors.length; i++) {
                    if (storage[id].stories.authors[i] === cmd.member.id) {
                        cmd.reply(
                            "You're already in the story! Type `/leave_story` if you want to leave."
                        );
                        return;
                    }
                }
                for (var i = 0; i < storage[id].stories.banned.length; i++) {
                    if (storage[id].stories.banned[i] === cmd.member.id) {
                        cmd.reply(
                            "Sorry! I've been instructed to keep you out. If a moderator would like to allow you back in, they may type `/moderate_story`."
                        );
                        return;
                    }
                }
                cmd.reply("I have added you to the list of authors");
                storage[id].stories.authors.push(cmd.member.id);
                if (
                    storage[id].stories.authors.length === 1 &&
                    storage[id].stories.story === []
                ) {
                    storage[id].stories.nextTurn =
                        storage[id].stories.authors[
                            Math.floor(
                                Math.random() *
                                    storage[id].stories.authors.length
                            )
                        ];
                    await fs.writeFileSync(
                        "story.txt",
                        storage[id].stories.story.join("\n")
                    );
                    client.users.cache
                        .find(
                            (user) => user.id === storage[id].stories.nextTurn
                        )
                        .send({
                            content:
                                id +
                                "\nIt is now your turn to write the story! Reply to this message with `~storyPart And then type your sentence here`",
                            files: ["./story.txt"],
                        })
                        .catch((e) => {});
                }
                break;
            case "moderate_story":
                if (perms("MANAGE_MESSAGES", true)) {
                    switch (cmd.options.getString("what_to_do")) {
                        case "kick":
                            var foundOne = false;
                            for (
                                var i = 0;
                                i < storage[id].stories.authors.length;
                                i++
                            ) {
                                if (
                                    storage[id].stories.authors[i] ===
                                    cmd.options.getUser("who").id
                                ) {
                                    storage[id].stories.authors.splice(i, 1);
                                    foundOne = true;
                                    i--;
                                }
                            }
                            if (foundOne) {
                                cmd.reply(
                                    "I have kicked the user from the authors."
                                );
                            } else {
                                cmd.reply(
                                    "I did not find that user in the author list."
                                );
                            }
                            break;
                        case "ban":
                            var foundOne = false;
                            for (
                                var i = 0;
                                i < storage[id].stories.authors.length;
                                i++
                            ) {
                                if (
                                    storage[id].stories.authors[i] ===
                                    cmd.options.getUser("who").id
                                ) {
                                    storage[id].stories.authors.splice(i, 1);
                                    foundOne = true;
                                    i--;
                                }
                            }
                            if (foundOne) {
                                cmd.reply(
                                    "I have kicked the user from the author list and have blocked them from rejoining."
                                );
                            } else {
                                cmd.reply(
                                    "The user will not be able to join the author list as requested."
                                );
                            }
                            storage[id].stories.banned.push(
                                cmd.options.getUser("who").id
                            );
                            break;
                        case "unban":
                            var foundOne = false;
                            for (
                                var i = 0;
                                i < storage[id].stories.banned.length;
                                i++
                            ) {
                                if (
                                    storage[id].stories.banned[i] ===
                                    cmd.options.getUser("who").id
                                ) {
                                    storage[id].stories.banned.splice(i, 1);
                                    foundOne = true;
                                    i--;
                                }
                            }
                            if (foundOne) {
                                cmd.reply(
                                    "The user will now be allowed to join if they so desire."
                                );
                            } else {
                                cmd.reply(
                                    "I did not find that user in the banned list."
                                );
                            }
                            break;
                        case "undo":
                            if (storage[id].stories.story.length > 0) {
                                storage[id].stories.story.splice(
                                    storage[id].stories.story.length - 1,
                                    1
                                );
                                cmd.reply(
                                    "I have undone the last contribution."
                                );
                            } else {
                                cmd.reply(
                                    "There is nothing to undo, or undo has already been used."
                                );
                            }
                            break;
                        case "reset":
                            storage[id].stories.story = [];
                            cmd.reply("The story has been reset.");
                            storage[id].stories.nextTurn =
                                storage[id].stories.authors[
                                    Math.floor(
                                        Math.random() *
                                            storage[id].stories.authors.length
                                    )
                                ];
                            await fs.writeFileSync(
                                "story.txt",
                                storage[id].stories.story.join("\n")
                            );
                            client.users.cache
                                .find(
                                    (user) =>
                                        user.id === storage[id].stories.nextTurn
                                )
                                .send({
                                    content:
                                        id +
                                        "\nIt is now your turn to write the story! Reply to this message with `~storyPart And then type your sentence here`",
                                    files: ["./story.txt"],
                                })
                                .catch((e) => {});
                            break;
                    }
                }
                break;
            case "leave_story":
                for (var i = 0; i < storage[id].stories.authors.length; i++) {
                    if (storage[id].stories.authors[i] === cmd.member.id) {
                        cmd.reply(
                            "You have been removed from the authors for this server."
                        );
                        return;
                    }
                }
                cmd.reply(
                    "You're not in the author list! You can type `/join_story` if you would like to become one."
                );
                break;
            case "story_so_far":
                await fs.writeFileSync(
                    "story.txt",
                    storage[id].stories.story.join("\n")
                );
                cmd.reply({
                    content: "Here is the story for this server so far",
                    files: ["./story.txt"],
                });
                break;
            case "list_story_authors":
                cmd.reply({
                    content: `Here are the current authors in this server:`,
                    embeds: [
                        {
                            type: "rich",
                            title: "Current Authors",
                            description:
                                "<@" +
                                storage[id].stories.authors.join(">\n<@") +
                                ">",
                            color: 0xff0000,
                        },
                    ],
                });
                break;
            case "skip_story_turn":
                if (id === "0") {
                    cmd.reply("Use in the server you want to skip!");
                    return;
                }
                if (
                    perms("MANAGE_MESSAGES", false) ||
                    storage[id].stories.nextTurn === cmd.member.id
                ) {
                    cmd.reply("I have skipped the turn.");
                    while (storage[id].stories.nextTurn === cmd.member.id) {
                        storage[id].stories.nextTurn =
                            storage[id].stories.authors[
                                Math.floor(
                                    Math.random() *
                                        storage[id].stories.authors.length
                                )
                            ];
                    }
                    await fs.writeFileSync(
                        "story.txt",
                        storage[id].stories.story.join("\n")
                    );
                    client.users.cache
                        .find(
                            (user) => user.id === storage[id].stories.nextTurn
                        )
                        .send({
                            content:
                                id +
                                "\nIt is now your turn to write the story! Reply to this message with `~storyPart And then type your sentence here`",
                            files: ["./story.txt"],
                        })
                        .catch((e) => {});
                    cmd.guild.channels.cache
                        .get(storage[id].stories.announceChannel)
                        .send({
                            embeds: [
                                {
                                    type: "rich",
                                    title: "Current Story Turn",
                                    description: `<@${storage[id].stories.nextTurn}>`,
                                    color: 0xff0000,
                                },
                            ],
                        });
                } else {
                    cmd.reply(
                        "Whoops! You aren't the next one up, and you don't have the `MANAGE_MESSAGES` permission!"
                    );
                }
                break;
            case "current_story_turn":
                cmd.reply({
                    embeds: [
                        {
                            type: "rich",
                            title: "Current Story Turn",
                            description: `<@${storage[id].stories.nextTurn}>`,
                            color: 0xff0000,
                        },
                    ],
                });
                break;
            case "set_story_turn":
                if (perms("MANAGE_MESSAGES", true)) {
                    cmd.reply("I have set the next turn.");
                    storage[id].stories.nextTurn =
                        cmd.options.getUser("who").id;
                    await fs.writeFileSync(
                        "story.txt",
                        storage[id].stories.story.join("\n")
                    );
                    client.users.cache
                        .find(
                            (user) => user.id === storage[id].stories.nextTurn
                        )
                        .send({
                            content:
                                id +
                                "\nIt is now your turn to write the story! Reply to this message with `~storyPart And then type your sentence here`",
                            files: ["./story.txt"],
                        })
                        .catch((e) => {});
                }
                break;
            case "dall-e":
                let allowNew = true;
                for (var i = 0; i < queue.length; i++) {
                    if (i.authorId === cmd.user.id) {
                        allowNew = false;
                    }
                }
                if (!allowNew) {
                    cmd.reply(
                        "You already have a request in the queue. Please wait until this finishes to continue."
                    );
                    return;
                }
                if (queue.length >= 6) {
                    await cmd.reply(
                        "The queue is too long at the moment. Please check back in 15 minutes."
                    );
                }
                if (queue.length === 0) {
                    await cmd.reply({
                        content:
                            "Request is being processed. Please note this could take up to two minutes.",
                        files: ["loading2.gif"],
                    });
                } else if (queue.length > 0) {
                    checker = setInterval(bustThroughQueue, 60000 * 2);
                    await cmd.reply({
                        content:
                            "Request added to queue. You are at position " +
                            (queue.length + 1) +
                            ". Please note this could take up to two minutes per queue item.",
                        files: ["loading2.gif"],
                    });
                }
                queue.push({
                    prompt: cmd.options.getString("prompt"),
                    inter: cmd,
                    authorId: cmd.user.id,
                });
                bustThroughQueue();
                break;
            case "namelock":
                if (!perms("MANAGE_NICKNAMES", true)) {
                    return;
                }
                if (!storage[cmd.options.getUser("who").id].allocated) {
                    storage[cmd.options.getUser("who").id] = defaultMember;
                }
                if (cmd.options.getBoolean("locked")) {
                    storage[cmd.options.getUser("who").id].nameLocked =
                        cmd.options.getUser("who").nickname;
                } else {
                    storage[cmd.options.getUser("who").id].nameLocked = null;
                }
                if (cmd.options.getBoolean("notify")) {
                    try {
                        cmd.options
                            .getUser("who")
                            .send(
                                cmd.options.getBooean("locked")
                                    ? "Your ability to change your nickname in " +
                                          cmd.guild.name +
                                          " has been rejected."
                                    : "Your ability to change your nickname in " +
                                          cmd.guild.name +
                                          " has been granted."
                            );
                    } catch (e) {}
                }
                cmd.reply(
                    "I have set **" +
                        cmd.options.getUser("who").tag +
                        "**'s lock on changing their nickname to " +
                        cmd.options.getBoolean("locked") +
                        "." +
                        (cmd.options.getBoolean("locked")
                            ? " Note that moderators will also be unable to set this user's nickname until the lock is removed."
                            : "") +
                        "\n\nWIP, not functional yet"
                );
                save();
                break;
            case "rac":
                if (id === "0") {
                    cmd.reply("Do it in a server - not DMs!");
                    return;
                } else if (cmd.options.getInteger("start")) {
                    rac = {
                        board: [],
                        lastPlayer: "Nobody",
                        timePlayed: 0,
                        players: [],
                        icons: "!@#$%^&*()_+=[]{};':`~,./<>?0123456789",
                    };
                    if (
                        cmd.options.getInteger("start") > 25 ||
                        cmd.options.getInteger("start") < 3
                    ) {
                        cmd.reply("The number should be between 3 and 25");
                        return;
                    }
                    for (var i = 0; i < cmd.options.getInteger("start"); i++) {
                        rac.board.push([]);
                        for (
                            var j = 0;
                            j < cmd.options.getInteger("start");
                            j++
                        ) {
                            rac.board[i].push("-");
                        }
                    }
                    rac.players = [cmd.member.id];
                    let row = new MessageActionRow()
                        .addComponents(
                            new MessageButton()
                                .setCustomId("racJoin")
                                .setLabel("Join Game")
                                .setStyle("DANGER")
                        )
                        .addComponents(
                            new MessageButton()
                                .setCustomId("racMove")
                                .setLabel("Make a Move")
                                .setStyle("SUCCESS")
                        );
                    cmd.reply({ content: getRACBoard(), components: [row] });
                } else if (cmd.options.getBoolean("help")) {
                    cmd.reply(
                        "**Rows & Columns**\n\nIn this game your goal is to make as many of the longest rows as possible. Diagonal rows do not count. 3 in a row is 1 point, 4 in a row is 2 points, 5 in a row is 3 points, and so on. The game ends when all spots are filled.\n\nTo join the game, press the Join Game button.\nTo make a move, press the Make a Move button and input the grid location of the spot you want to move (So if you wanted to move in the third spot from the left on the top row, you would type `AC`).\n\nThis is not a turn-based game - you may move once every 15 minutes, or once _anybody else_ has moved. This is a game of skill, strategy, and speed."
                    );
                }
                break;
        }
        save();
    } catch (e) {
        console.log(e);
    }
});
client.on("guildCreate", async (guild) => {
    callHome("Added to " + guild.name);
    storage[guild.id] = defaultGuild;
});
client.on("guildDelete", async (guild) => {
    if (guild.name !== undefined) {
        callHome("Removed from " + guild.name);
    }
});
client.on("guildMemberAdd", async (member) => {
    try {
        try {
            if (!storage[member.id].allocated) {
            }
        } catch (e) {
            storage[member.id] = defaultMember;
            storage[member.id].names = [member.tag];
        }
        if (storage[member.guild.id].invTrackers.tracking) {
            let possibleInvs = [];
            let newInvs = [];
            console.log("New member");
            /*
                let allInvites = invites.map((i) => ({
                        name: 'Invite',
                        value: `**Inviter:** ${i.inviter}
                        **Code:** [${i.code}](https://discord.gg/${i.code})
                        **Used by:** ${i.uses} of ${i.maxUses === 0 ? '∞' : i.maxUses}
                        **Expires on:** ${
                                i.maxAge
                                ? new Date(i.createdTimestamp + i.maxAge * 1000).toLocaleString()
                                : 'never'
                        }`,
                        inline: true,
                }));
                */
            member.guild.invites.fetch().then((invites) => {
                console.log("Checking for new invites");
                newInvs = invites.map((i) => ({
                    invite: "https://discord.gg/" + i.code,
                    uses: i.uses,
                }));
            });
            let didIt = false;
            for (
                var i = 0;
                i < storage[member.guild.id].invTrackers.trackedInvs.length;
                i++
            ) {
                console.log(
                    storage[member.guild.id].invTrackers.trackedInvs[i].invite
                );
                didIt = false;
                for (var j = 0; j < newInvs.length; j++) {
                    console.log("Checking one of the invites");
                    if (
                        newInvs[j].invite ===
                        storage[member.guild.id].invTrackers.trackedInvs[i]
                            .invite
                    ) {
                        console.log("It has an equivalent");
                        if (
                            newInvs[j].uses >
                            storage[member.guild.id].invTrackers.trackedInvs[i]
                                .uses
                        ) {
                            possibleInvs.push(newInvs[j].invite);
                            console.log("Boom");
                        }
                        didIt = true;
                        j = newInvs.length;
                    }
                }
                if (!didIt) {
                    possibleInvs.push(
                        storage[member.guild.id].invTrackers.trackedInvs[i]
                            .invite
                    );
                }
            }
            newInvs = [];
            member.guild.invites.fetch().then((invites) => {
                newInvs = invites.map((i) => ({
                    invite: "https://discord.gg/" + i.code,
                    uses: i.uses,
                }));
            });
            storage[member.guild.id].invTrackers.trackedInvs = newInvs;
            member.guild.channels.cache
                .get(storage[member.guild.id].invTrackers.reportChannel)
                .send(
                    "Possible invites used: <" + possibleInvs.join(">, <") + ">"
                );
            save();
        }
        if (
            storage[member.guild.id].logs.log &&
            storage[member.guild.id].logs.userJoins
        ) {
            member.guild.channels.cache
                .get(storage[member.guild.id].logs.channel)
                .send(
                    "**" +
                        member.tag +
                        "** just joined! Previously known as the following as far as I know:\n" +
                        storage[member.id].names
                );
        }
        save();
        if (member.guild.id === "983074750165299250") {
            member.roles.add(
                member.guild.roles.cache.find((i) => i.name === "Tier 1")
            );
            //member.guild.channels.cache.find(i => i.name === 'logs').send(member.user.tag+" just joined.")
        }
        if (member.guild.id === "810540153294684192") {
            member.guild.channels.cache
                .get("940140532229890068")
                .send(
                    "Hello and welcome to Khancord <@" +
                        member.id +
                        ">!\n\nWe need to fulfill a couple of things to get you verified. First of all, please go to your Khan Academy profile and change your bio to read `KhancordVerify-" +
                        member.id +
                        "`. Then type `~verify [KHAN ACADEMY PROFILE LINK]` here to continue!\nNote: If your profile link includes `/me`, this redirects everybody to their own profile. We cannot accept this type of link. Instead, next to your avatar there should be an `@` symbol - let us know what it says next to that!\n\nIf you need help with any step of this process, you can ping @Verification Ping."
                );
        }
    } catch (e) {
        console.log(e);
    }
});
client.on("userUpdate", async (oldUser, newUser) => {
    try {
        try {
            if (!storage[newUser.id].allocated) {
            }
        } catch (e) {
            storage[newUser.id] = defaultMember;
            storage[newUser.id].names = [oldUser.tag];
        }
        save();
        function guildAlert(what) {
            client.guilds.cache.forEach((guild) => {
                try {
                    if (!storage[guild.id].allocated) {
                        storage[guild.id] = defaultGuild;
                    }
                } catch (e) {
                    storage[guild.id] = defaultGuild;
                }
                try {
                    if (guild.members.cache.get(newUser.id)) {
                        if (
                            storage[guild.id].logs.log &&
                            storage[guild.id].logs.userEdit
                        ) {
                            guild.channels.cache
                                .get(storage[guild.id].logs.channel)
                                .send(what);
                        }
                    }
                } catch (e) {
                    console.log(e);
                }
            });
        }
        let diff = "";
        let oldKeys = Object.keys(oldUser);
        let newKeys = Object.keys(newUser);
        for (var i in newKeys) {
            if (oldUser[oldKeys[i]] !== newUser[newKeys[i]]) {
                diff = newKeys[i];
            }
        }
        console.log(diff);
        switch (diff) {
            case "avatar":
                if (oldUser.avatar === null) {
                    guildAlert({
                        content:
                            "**" +
                            newUser.tag +
                            "** changed their avatar. This is what it now is:",
                        files: [
                            "https://cdn.discordapp.com/avatars/" +
                                newUser.id +
                                "/" +
                                newUser.avatar +
                                ".webp",
                        ],
                    });
                    console.log("User Changed");
                    return;
                }
                if (newUser.avatar === null) {
                    guildAlert({
                        content:
                            "**" +
                            newUser.tag +
                            "** removed their avatar. This is what it previously was:",
                        files: [
                            "https://cdn.discordapp.com/avatars/" +
                                oldUser.id +
                                "/" +
                                oldUser.avatar +
                                ".webp",
                        ],
                    });
                    return;
                }
                guildAlert({
                    content: `${newUser.tag} changed their avatar.`,
                    embeds: [
                        {
                            type: "rich",
                            title: oldUser.tag,
                            description: `Old Avatar`,
                            color: 0xff0000,
                            thumbnail: {
                                url: `https://cdn.discordapp.com/avatars/${oldUser.id}/${oldUser.avatar}.webp`,
                                height: 0,
                                width: 0,
                            },
                        },
                        {
                            type: "rich",
                            title: newUser.tag,
                            description: `New Avatar`,
                            color: 0xff0000,
                            thumbnail: {
                                url: `https://cdn.discordapp.com/avatars/${newUser.id}/${newUser.avatar}.webp`,
                                height: 0,
                                width: 0,
                            },
                        },
                    ],
                });
                //guildAlert({content:"**"+newUser.tag+"** changed their avatar.",files:["https://cdn.discordapp.com/avatars/"+oldUser.id+"/"+oldUser.avatar+".webp","https://cdn.discordapp.com/avatars/"+newUser.id+"/"+newUser.avatar+".webp"]});
                break;
            case "username" || "tag" || "discriminator":
                guildAlert(`**${oldUser.tag}** is now **${newUser.tag}**`);
                storage[newUser.id].names.push(newUser.tag);
                break;
        }
    } catch (e) {
        console.log(e);
    }
});
client.on("guildMemberUpdate", async (oldMember, newMember) => {
    try {
        try {
            if (!storage[newMember.user.id].allocated) {
            }
        } catch (e) {
            storage[newMember.user.id] = defaultMember;
            storage[newMember.user.id].names = [oldMember.user.tag];
        }
        save();
        let diff = "";
        if (!storage[newMember.guild.id].logs.log) {
            return;
        }
        if (oldMember.nickname !== newMember.nickname) {
            if (
                storage[newMember.id].nameLocked !== null &&
                storage[newMember.id].nameLocked !== undefined &&
                storage[newMember.id].nameLocked !== newMember.nickname
            ) {
                console.log(
                    storage[newMember.id].nameLock + " | " + newMember.nickname
                );
                client.guilds.cache
                    .get(newMember.guild.id)
                    .members.cache.get(newMember.id)
                    .setNickname(storage[newMember.id].nameLock);
                return;
            }
            if (
                newMember.nickname === null ||
                newMember.nickname === undefined
            ) {
                client.guilds.cache
                    .get(newMember.guild.id)
                    .channels.cache.get(
                        storage[newMember.guild.id].logs.channel
                    )
                    .send(
                        `**${newMember.user.tag}**'s nickname has changed from **${oldMember.nickname}** to **${newMember.username}**`
                    );
                return;
            }
            if (
                oldMember.nickname === null ||
                oldMember.nickname === undefined
            ) {
                client.guilds.cache
                    .get(newMember.guild.id)
                    .channels.cache.get(
                        storage[newMember.guild.id].logs.channel
                    )
                    .send(
                        `**${newMember.user.tag}**'s nickname has changed from **${oldMember.username}** to **${newMember.nickname}**`
                    );
                return;
            }
            client.guilds.cache
                .get(newMember.guild.id)
                .channels.cache.get(storage[newMember.guild.id].logs.channel)
                .send(
                    `**${newMember.user.tag}**'s nickname has changed from **${oldMember.nickname}** to **${newMember.nickname}**`
                );
        }
        if (oldMember.avatar !== newMember.avatar) {
            let embs = [];
            if (oldMember.avatar !== null && oldMember.avatar !== undefined) {
            }
            if (newMember.avatar !== null && newMember.avatar !== undefined) {
            }
            client.guilds.cache
                .get(newMember.guild.id)
                .channels.cache.get(storage[newMember.guild.id].logs.channel)
                .send({ embeds: embs });
        }
        if (oldMember.banner !== newMember.banner) {
            diff = "banner";
        }
    } catch (e) {
        console.log(e);
    }
});
client.on("inviteCreate", async (inv) => {
    if (storage[inv.guild.id].invTrackers.tracking) {
        storage[inv.guild.id].invTrackers.trackedInvs.push({
            invite: "https://discord.gg/" + inv.code,
            uses: inv.uses,
        });
        inv.guild.channels.cache
            .get(storage[inv.guild.id].invTrackers.reportChannel)
            .send("Invite **" + inv.code + "** created");
    }
});
process.on("uncaughtException", (e) => console.log(e));
client.login(
    "OTY2MTY3NzQ2MjQzMDc2MTM2.GcZS69.gQ_VF3fQDqmBOo4RuDmM7hEQbyjUwXksYP8FaE"
);