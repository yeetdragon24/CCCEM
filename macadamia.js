Game.LoadMod("https://requirejs.org/docs/release/2.3.6/minified/require.js", () => {
    define("logs", ["require", "exports"], function (require, exports) {
	    "use strict";
	    Object.defineProperty(exports, "__esModule", { value: true });
	    exports.Logger = void 0;
	    exports.boot = boot;
	    exports.welcome = welcome;
	    exports.init = init;
	    exports.log = log;
	    function boot(id) {
	        console.log(`%cbooting %c${id}%c...`, "color: #d9b99b;", "color: #fff0db;", "color: #d9b99b;");
	    }
	    function welcome() {
	        console.log("%cmacadamia has booted!\n%cif you're a modder, read the docs here:\nhttps://macadamia.redbigz.com/docs", "color: #d9b99b; font-weight: 700; font-size: 1.5em;", "color: #fff0db;");
	    }
	    function init() {
	        console.log(`%c🥜 macadamia %cby redbigz\n%cv${window.Macadamia.Version} | main | CC v${window.VERSION}`, "color: #d9b99b; font-size: 2em;", "font-weight: 700;", "color: #fff0db;");
	    }
	    function log(from, msg) {
	        console.log(`%c[${from}] %c${msg}`, "color: #d9b99b;", "color: #fff0db;");
	    }
	    class Logger {
	        from;
	        constructor(from) {
	            this.from = from;
	        }
	        log(msg) {
	            log(this.from, msg);
	        }
	    }
	    exports.Logger = Logger;
	});
	define("cleaner", ["require", "exports", "logs"], function (require, exports, logs_1) {
	    "use strict";
	    Object.defineProperty(exports, "__esModule", { value: true });
	    exports.clean = clean;
	    function clean() {
	        const logger = new logs_1.Logger("macadamia::cleaner");
	        logger.log("cleaning up localStorage...");
	        let macadamiaUnusedSaves = Object.keys(localStorage).filter(key => key.startsWith("macadamia_"));
	        for (var key of macadamiaUnusedSaves) {
	            localStorage.removeItem(key);
	        }
	        logger.log(`cleaned up ${macadamiaUnusedSaves.length} unused save${macadamiaUnusedSaves.length == 1 ? "" : "s"}.`);
	    }
	});
	define("raisin", ["require", "exports"], function (require, exports) {
	    "use strict";
	    Object.defineProperty(exports, "__esModule", { value: true });
	    exports.ModRaisin = exports.Raisin = void 0;
	    // https://stackoverflow.com/questions/1007981/how-to-get-function-parameter-names-values-dynamically
	    var STRIP_COMMENTS = /(\/\/.*$)|(\/\*[\s\S]*?\*\/)|(\s*=[^,\)]*(('(?:\\'|[^'\r\n])*')|("(?:\\"|[^"\r\n])*"))|(\s*=[^,\)]*))/mg;
	    var ARGUMENT_NAMES = /([^\s,]+)/g;
	    function getParamNames(func) {
	        var fnStr = func.toString().replace(STRIP_COMMENTS, '');
	        var result = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
	        if (result === null)
	            return [];
	        return result;
	    }
	    function getFunctionBody(func) {
	        var fnStr = func.toString();
	        if (fnStr.indexOf('{') == -1) {
	            return fnStr.split("=>")[1].trim();
	        }
	        var start = fnStr.indexOf('{') + 1;
	        var end = fnStr.lastIndexOf('}');
	        return fnStr.substring(start, end).trim();
	    }
	    window.RaisinUUIDs = {};
	    class Raisin {
	        body;
	        params;
	        /**
	         * Initialises a new Raisin.
	         *
	         * @param {function} func - The function.
	         */
	        constructor(func) {
	            this.body = getFunctionBody(func).split("\n");
	            this.params = getParamNames(func);
	        }
	        /**
	         * Inserts the specified code at the given line.
	         *
	         * @param {number} line - The line number to insert the code.
	         * @param {string|function} code - The code to insert. If a function, a decorator is added.
	         * @param {boolean} [replace=false] - Whether to replace the existing code at the line.
	         * @return {this}
	         */
	        insert(line, code, replace = false) {
	            if (line < 0) {
	                line = this.body.length + 1 + line;
	            }
	            if (typeof code === "string") {
	                var inject = code;
	            }
	            else {
	                var codeParams = getParamNames(code).join(",");
	                var inject = `([${codeParams}] = ((${codeParams}) => {${getFunctionBody(code)};return [${codeParams}]}).call(this, ${codeParams}));`;
	            }
	            // console.log(inject)
	            this.body.splice(line, replace ? 1 : 0, inject);
	            return this;
	        }
	        /**
	         * Inserts the specified code at the given line, based on a signature match.
	         *
	         * @param {string} signature - The signature to match in the code.
	         * @param {string|function} code - The code to insert. If a function, a decorator is added.
	         * @param {boolean} [entireLine=true] - Whether to replace the entire line or just the matched signature.
	         * @param {boolean} [replaceLine=false] - Whether to replace the existing code at the line.
	         * @return {this}
	         */
	        insertPerSignature(signature, code, entireLine = true, replaceLine = false) {
	            for (var i in this.body) {
	                if (this.body[i].match(signature)) {
	                    if (entireLine)
	                        this.insert(i + replaceLine ? 0 : 1, code, replaceLine);
	                    else
	                        this.body[i] = this.body[i].replaceAll(signature, code);
	                }
	            }
	            return this;
	        }
	        /**
	         * Runs the function code through a transpiler.
	         *
	         * @param {function} transpiler - The transpiler function to use.
	         * @return {this}
	         */
	        transpile(transpiler) {
	            this.body = transpiler(this.body);
	            return this;
	        }
	        /**
	         * Compiles the function body and parameters into a new function.
	         *
	         * @return {function} The compiled function.
	         */
	        compile() {
	            return new Function(...this.params, this.body.join("\n"));
	        }
	    }
	    exports.Raisin = Raisin;
	    class ModRaisin extends Raisin {
	        modID;
	        constructor(modID, func) {
	            super(func);
	            this.modID = modID;
	        }
	        insert(line, code, replace) {
	            if (line < 0) {
	                line = this.body.length + 1 + line;
	            }
	            if (typeof code === "string") {
	                var inject = code;
	            }
	            else {
	                var codeParams = getParamNames(code).join(",");
	                var inject = `if (window.MacadamiaModList['${this.modID}'].enabled) ([${codeParams}] = ((${codeParams}) => {${getFunctionBody(code)};return [${codeParams}]}).call(this, ${codeParams}));`;
	            }
	            // console.log(inject)
	            this.body.splice(line, replace ? 1 : 0, inject);
	            return this;
	        }
	        transpile(transpiler) {
	            this.body = ["if (window.MacadamiaModList['" + this.modID + "'].enabled) {", ...transpiler(this.body), "} else {", ...this.body, "}"];
	            return this;
	        }
	    }
	    exports.ModRaisin = ModRaisin;
	});
	define("hooks", ["require", "exports"], function (require, exports) {
	    "use strict";
	    Object.defineProperty(exports, "__esModule", { value: true });
	    exports.Hooks = exports.HookList = void 0;
	    exports.buildHooks = buildHooks;
	    class Hook {
	        id;
	        subscribers;
	        enabled = true;
	        constructor(id) {
	            this.id = id;
	            this.subscribers = [];
	        }
	        subscribe(callback) {
	            this.subscribers.push(callback);
	        }
	        publish(message) {
	            if (!this.enabled)
	                return;
	            for (var i in this.subscribers) {
	                this.subscribers[i](message);
	            }
	        }
	        feed(message) {
	            let output = message;
	            for (var i in this.subscribers) {
	                output = this.subscribers[i](output);
	            }
	            return output;
	        }
	    }
	    class HookList {
	        hooks;
	        #enabled = true;
	        constructor() {
	            this.hooks = {};
	        }
	        addHook(hook) {
	            this.hooks[hook.id] = hook;
	            return hook;
	        }
	        hook(id) {
	            return this.hooks[id];
	        }
	        get enabled() {
	            return this.#enabled;
	        }
	        set enabled(value) {
	            this.#enabled = value;
	            for (var i in this.hooks) {
	                this.hooks[i].enabled = value;
	            }
	        }
	    }
	    exports.HookList = HookList;
	    var VanillaHooks;
	    (function (VanillaHooks) {
	        VanillaHooks["Draw"] = "vanilla/draw";
	        VanillaHooks["Logic"] = "vanilla/logic";
	        VanillaHooks["CPS"] = "vanilla/cps";
	    })(VanillaHooks || (VanillaHooks = {}));
	    exports.Hooks = {
	        Vanilla: VanillaHooks,
	    };
	    function buildHooks() {
	        let hooks = new HookList();
	        // Create hooks
	        let drawHook = hooks.addHook(new Hook(exports.Hooks.Vanilla.Draw));
	        let logicHook = hooks.addHook(new Hook(exports.Hooks.Vanilla.Logic));
	        let cpsHook = hooks.addHook(new Hook(exports.Hooks.Vanilla.CPS));
	        // Implement vanilla hooks
	        Game.registerHook("draw", () => drawHook.publish({}));
	        Game.registerHook("logic", () => logicHook.publish({}));
	        Game.registerHook("cps", (cps) => cpsHook.feed({ cps }).cps);
	        return hooks;
	    }
	});
	define("core/modManager", ["require", "exports", "logs"], function (require, exports, logs_2) {
	    "use strict";
	    Object.defineProperty(exports, "__esModule", { value: true });
	    exports.loadModManager = loadModManager;
	    let pages = {
	        mods() {
	            function buildContainer(mods) {
	                return mods.map((mod) => {
	                    let disabler = `<a class="option${mod.enabled ? "" : " warning"}" style="font-size: 8pt; padding: 4px; float: right;" onclick="this.className = this.className == 'option warning' ? 'option' : 'option warning'; this.innerHTML = this.innerHTML == '✕ disabled' ? '✓ enabled' : '✕ disabled'; window.Macadamia.toggleMod('${mod.manifest.uuid}')">${mod.enabled ? "✓ enabled" : "✕ disabled"}</a>`;
	                    return `<div style="display: block; height: 48px;">
	                    <img src="${mod.manifest.icon || "favicon.ico"}" style="image-rendering: pixelated; float: left; padding-right: 15px; overflow: hidden;" height="48px">
	                    <div style="text-align: left;">
	                        <span style='font-size: 12pt; font-weight: 700; position: relative;'>${mod.manifest.name}</span>
	                        <small>${mod.manifest.version}</small><br>
	                        by ${mod.manifest.author}<br>
	
	                        ${mod.manifest.uuid != "macadamia" ? disabler : ""}
	                    </div>
	                </div>`;
	                });
	            }
	            return `${[...buildContainer(Object.values(window.MacadamiaModList))].join("<br>")}`;
	        },
	        settings() {
	            return `<a class="option${localStorage.getItem("streamerMode") !== "true" ? " warning" : ""}" onclick="window.Macadamia.toggleStreamerMode(); this.innerHTML = this.innerHTML == '✕ Streamer Mode' ? '✓ Streamer Mode' : '✕ Streamer Mode'; this.className = this.className == 'option warning' ? 'option' : 'option warning';">${localStorage.getItem("streamerMode") !== "true" ? "✕ Streamer Mode" : "✓ Streamer Mode"}</a><br><small>regenerates your peer id every time you restart the game.</small><br>For changes to take effect, restart the game.`;
	        },
	        about() {
	            return `<img src="https://redbigz.com/lfs/macadamia/res/logo.png" style="image-rendering: pixelated; width: 32px; height: 32px; vertical-align: middle;"><b>Macadamia</b><br>by RedBigz<br><small>${window.MacadamiaModList.macadamia.manifest.version}</small>`;
	        }
	    };
	    function generateLinks(links, current) {
	        return Object.values(links).map((key) => {
	            return `${key == current ? "<b>" : ""}<a href="javascript:window.ShowModManager('${key}')">${key}</a>${key == current ? "</b>" : ""}`;
	        }).join(" | ");
	    }
	    async function loadModManager() {
	        const logger = new logs_2.Logger("macadamia::modManager");
	        logger.log("loading mod manager...");
	        window.ShowModManager = (page) => {
	            Game.Prompt(`<h3>Macadamia</h3><br>${generateLinks(["mods", "settings", "about"], page)}<br><div class=block style="position: relative; top: 5px; margin-bottom: 10px;">${pages[page]()}</div>`, []);
	        };
	        logger.log("mod manager loaded.");
	    }
	});
	define("util", ["require", "exports"], function (require, exports) {
	    "use strict";
	    Object.defineProperty(exports, "__esModule", { value: true });
	    exports.injectCSS = injectCSS;
	    function injectCSS(css) {
	        const style = document.createElement("style");
	        style.textContent = css;
	        document.head.appendChild(style);
	    }
	});
	define("core/multiplayer", ["require", "exports", "logs", "raisin", "util"], function (require, exports, logs_3, raisin_1, util_1) {
	    "use strict";
	    Object.defineProperty(exports, "__esModule", { value: true });
	    exports.SharedVariable = exports.RPC = void 0;
	    exports.loadMultiplayer = loadMultiplayer;
	    var metadata = {
	        name: "Unnamed",
	    };
	    const logger = new logs_3.Logger("macadamia::multiplayer");
	    let connections = [];
        window.connectedPlayers = [];
	    let rpcFunctions = {};
	    let netcodeSettings = {
	        syncPeriod: 60000,
	        hosting: true,
	        host: ""
	    };
		window.netcodeSettingsExport = netcodeSettings;
	    window.inGame = false;
	    var alreadyLoadedSave = false
	    function loadPeerJS() {
	        return new Promise((resolve) => {
	            Game.LoadMod("https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js", () => {
	                resolve();
	            });
	        });
	    }
	    window.DO_NOT_RPC = false;
	    var playerListElement = document.createElement("div");
	    playerListElement.style.cssText = "position: fixed; top: 40px; left: 10px; color: yellow; text-shadow: black 0 0 5px; font-family: Tahoma; z-index: 9999;";
	    playerListElement.id = "playerList";
	    document.body.appendChild(playerListElement);
	    window.ShowInvitePrompt = () => {
	        Game.Prompt(`<h3>Invite Friends</h3><br><div class=block><b>Peer ID</b><br><code style='font-family: monospace; user-select: text;'>${window.peer.id}</code></div><span style='color:#e33;font-weight:700;'><br>Your IP address is visible to those who join you/know your peer id! DO NOT HAND IT TO ANYONE THAT YOU DO NOT TRUST.</span><br>`, []);
	    };
	    var saveToOld = Game.SaveTo;
	    window.CloseConnection = () => {
	        for (var connection in connections) {
	            connections[connection].close();
	        }
	        Game.SaveTo = saveToOld;
	        Game.LoadSave();
	        localStorage.removeItem(Game.SaveTo);
	    };
	    window.JoinGame = () => {
	        Game.Prompt("<h3>Join Game</h3><br>Macadamia uses a P2P system for playing multiplayer. <b>Your IP address will be shared with users in your lobby due to how the networking is managed.</b><br><br><input id=peeridinput class=block placeholder='Peer ID' style='text-align:center;background-color:rgba(0,0,0,0);color:white;width:120px;margin-bottom:10px;'>", [["Join", "window.StartJoinGame(document.getElementById('peeridinput').value)"]]);
	    };
	    window.StartJoinGame = (peerID) => {
	        Game.ClosePrompt();
	        if (peerID == window.peer.id) {
	            Game.Prompt("You can't join yourself!", []);
	            return;
	        }
	        if (peerID == "") {
	            Game.Prompt("Invalid peer ID!", []);
	            return;
	        }
	        for (var connection in connections) {
	            connections[connection].close();
	        }
	        connections.splice(0, Infinity);
	        Game.SaveTo = peerID;
	        window.CreateConnection(peerID);
			if (MacadamiaModList.mouse) { MacadamiaModList.mouse.mod.initMouses([peerID]); setTimeout(() => { window.MacadamiaModList.mouse.mod.newMouseRPC.send({ uuid: window.peer.id, x: Game.mouseX, y: Game.mouseY }); }, 5000); }
            if (MacadamiaModList.tduuid) { MacadamiaModList.tduuid.mod.constructDisplayList([peerID]); setTimeout(() => { MacadamiaModList.tduuid.mod.newRowRPC.send({ id: window.peer.id }); }, 5000); }
	    };
	    window.setUsername = (name) => {
	        localStorage.setItem('macadamiaUsername', name);
	        sendDataToPeers({ type: "newName", data: name });
	        metadata.name = name;
	        rebuildPlayerList();
	    };
	    window.ChangeUsername = () => {
	        Game.Prompt("<h3>Change Username</h3><br>Choose a username:<br><br><input id=nameinput class=block placeholder='Username' style='text-align:center;background-color:rgba(0,0,0,0);color:white;width:120px;margin-bottom:10px;'>", [["Change", "window.setUsername(document.getElementById('nameinput').value); Game.ClosePrompt();"]]);
	    };
	    function rebuildPlayerList() {
	        let output = `${metadata.name} (you)`;
	        for (var connection in connections) {
	            output += `\n${connections[connection].macaName}`;
	        }
	        playerListElement.innerText = output;
	        var menuArea = "";
	        menuArea += "<a class='option' onclick='window.ShowModManager(\"mods\")'>☰ Mods & Settings</a>";
	        if (connections.length == 0)
	            netcodeSettings.hosting = true;
	        if (!netcodeSettings.hosting) {
	            if (connections.length > 0)
	                menuArea += "<a class='option' onclick='window.CloseConnection()'>✕ Leave</a>";
	        }
	        if (netcodeSettings.hosting) {
	            menuArea += "<a class='option' onclick='window.ShowInvitePrompt()'>➕ Invite</a>";
	            menuArea += "<a class='option' onclick='window.JoinGame()'>⮐ Join Game</a>";
	        }
	        menuArea += "<a class='option' onclick='window.ChangeUsername()'>✎</a>";
	        playerListElement.innerHTML = menuArea + "<br><br>" + playerListElement.innerHTML;
	    }
	    async function loadMultiplayer() {
	        logger.log("loading multiplayer...");
	        if (localStorage.getItem("multiplayerID") == null || localStorage.getItem("streamerMode") == "true")
	            localStorage.setItem("multiplayerID", crypto.randomUUID());
	        if (localStorage.getItem("macadamiaUsername") !== null) {
	            metadata.name = localStorage.getItem("macadamiaUsername");
	        }
	        // load peerjs
	        logger.log("waiting for peerjs...");
	        await loadPeerJS();
	        logger.log("peerjs loaded successfully!");
	        var peer = new window.Peer(`macadamia_${localStorage.getItem("multiplayerID")}`);
	        logger.log("created peer");
	        window.peer = peer;
	        logger.log("loading player list...");
	        (0, util_1.injectCSS)("#playerList { pointer-events: none; } #playerList > * { pointer-events: auto; }");
	        rebuildPlayerList();
	        console.log(`%cmacadamia::multiplayer\n%c🌐 network\n%cpeer id: %c${peer.id}\n\n%c/!\\ warning\n%cyour IP address is visible to those who join you/know your peer id!\nDO NOT HAND IT TO ANYONE THAT YOU DO NOT TRUST.`, "font-size: 0.5rem;", "color: #7289da; font-size: 1rem;", "color: #d9b99b;", "color: #fff0db;", "color: #e22; font-size: 1rem; font-weight: 700; text-shadow: #F00 1px 0 3px;", "color: #e22");
	        let onConnection = (connection, connectionFromNewPeer) => {
	            connection.macaName = "Unnamed";
	            connection.on("open", () => {
	                if (connections.length >= 4) {
	                    connection.close();
	                    logger.log(`received connection from ${connection.peer}, but kicked because server is full`);
	                    return;
	                }
	                if (connection.peer != window.peer.id) {
	                    logger.log(`received connection from ${connection.peer}`);
	                }
	                if (!connectionFromNewPeer && netcodeSettings.hosting) {
	                    // sendDataToPeers({ type: "newPeer", peer: connection.peer })
	                    for (var otherConnection in connections) {
	                        connection.send({ type: "newPeer", data: connections[otherConnection].peer });
	                    }
	                }
	                connections.push(connection); // add connection to connections array
	                connection.send({ type: "newName", data: metadata.name });
	                rebuildPlayerList();
	                if (netcodeSettings.hosting) {
	                    connection.send({ type: "saveData", data: Game.WriteSave(1) });
	                }
	                connection.on("data", (data) => {
	                    // console.log(data)
	                    if (!data.type || !data.data)
	                        return;
	                    switch (data.type) {
	                        case "macadamiaSync":
	                            // handle cookies
	                            if (connection.peer != netcodeSettings.host)
	                                return;
	                            if (!data.data)
	                                return;
	                            //Game.LoadSave(data.data);
	                            // Game.cookies = data.cookies;
	                            break;
	                        case "rpc":
	                            // handle rpc
	                            if (!data.data.modID)
	                                return;
	                            if (!data.data.name)
	                                return;
	                            if (!rpcFunctions[data.data.modID])
	                                return;
	                            if (!rpcFunctions[data.data.modID][data.data.name])
	                                return;
	                            if (window.MacadamiaModList[data.data.modID].enabled == false)
	                                return;
	                            if (data.data.payload)
	                                rpcFunctions[data.data.modID][data.data.name](data.data.payload);
	                            else
	                                rpcFunctions[data.data.modID][data.data.name]();
	                            break;
	                        case "saveData":
	                            if (data.data && !alreadyLoadedSave && !netcodeSettings.hosting && connection.peer == netcodeSettings.host) {
	                                Game.LoadSave(data.data);
	                                alreadyLoadedSave = true;
	                            }
	                            break;
	                        case "newPeer":
	                            if (data.data && typeof data.data === "string" && connections.length < 4) {
	                                var conn = peer.connect(data.data);
	                                onConnection(conn, true);
	                            }
	                            break;
	                        case "newName":
	                            if (data.data && typeof data.data === "string") {
	                                connection.macaName = data.data;
	                                rebuildPlayerList();
	                            }
	                        default:
	                            return;
	                    }
	                });
	                connection.on("close", () => {
	                    connections.splice(connections.indexOf(connection), 1);
	                    rebuildPlayerList();
	                });
	            });
	        };
	        peer.on("connection", (conn) => onConnection(conn, false));
	        window.CreateConnection = (id) => { onConnection(peer.connect(id), true); netcodeSettings.host = id; netcodeSettings.hosting = false; alreadyLoadedSave = false; };
	        // establish hooks
	        // On click cookie
	        var clickRPC = new RPC("macadamia", "clickCookie");
	        clickRPC.setCallback(() => {
	            window.DO_NOT_RPC = true; Game.ClickCookie(); window.DO_NOT_RPC = false;
	        });
	        var bigCookie = document.querySelector("button#bigCookie");
	        // @ts-ignore
	        bigCookie.removeEventListener("click", Game.ClickCookie);
	        bigCookie.onclick = (event) => {
	            clickRPC.rpc();
	        };
	        window.upgradeRPC = new RPC("macadamia", "upgradePurchased");
	        window.upgradeRPC.setCallback((data) => {
	            var upgrade = Game.UpgradesById[data.id];
	            if (!upgrade)
	                return;
	            if (!upgrade.vanilla)
	                return;
	            if (upgrade.bought)
	                return;
	            window.DO_NOT_RPC = true;
	            upgrade.buy(false);
	            window.DO_NOT_RPC = false;
	        });
	        Game.Upgrade.prototype.buy = new raisin_1.Raisin(Game.Upgrade.prototype.buy)
	            .insert(0, function () {
	            if (!this.vanilla)
	                return;
	            window.upgradeRPC.send({ id: this.id });
	        })
	            .compile();
	        // On upgrade purchased
	        for (var objectID in Game.ObjectsById) {
	            var object = Game.ObjectsById[objectID];
	            // On building purchased
	            window.buildingRPC = new RPC("macadamia", "buildingPurchased");
	            window.buildingRPC.setCallback((data) => {
	                if (!data.amount)
	                    return;
	                var building = Game.ObjectsById[data.id];
	                if (!building)
	                    return;
	                if (!building.vanilla)
	                    return;
	                window.DO_NOT_RPC = true; // TODO: Find a better way to do this
	                var oldBuyMode = Game.buyMode;
	                Game.buyMode = 1;
	                building.buy(data.amount);
	                Game.buyMode = oldBuyMode;
	                window.DO_NOT_RPC = false;
	            });
	            object.buy = new raisin_1.Raisin(object.buy)
	                .insert(0, function () {
	                if (!this.vanilla)
	                    return [];
	                if (Game.buyMode == -1)
	                    return []; // sell mode
	                window.buildingRPC.send({ id: this.id, amount: Game.buyBulk });
	            })
	                .compile();
	            // On building sold
	            window.buildingSellRPC = new RPC("macadamia", "buildingSold");
	            window.buildingSellRPC.setCallback((data) => {
	                if (!data.amount)
	                    return;
	                var building = Game.ObjectsById[data.id];
	                if (!building)
	                    return;
	                if (!building.vanilla)
	                    return;
	                window.DO_NOT_RPC = true;
	                building.sell(data.amount, undefined);
	                window.DO_NOT_RPC = false;
	            });
	            object.sell = new raisin_1.Raisin(object.sell)
	                .insert(0, function () {
	                if (!this.vanilla)
	                    return [];
	                window.buildingSellRPC.send({ id: this.id, amount: Game.buyBulk });
	            })
	                .compile();
	            // On building upgrade
	            window.buildingUpgradeRPC = new RPC("macadamia", "buildingUpgrade");
	            window.buildingUpgradeRPC.setCallback((data) => {
	                if (!data.id)
	                    return;
	                var building = Game.ObjectsById[data.id];
	                if (!building)
	                    return;
	                if (!building.vanilla)
	                    return;
	                var oldLumps = Game.prefs.askLumps;
	                Game.prefs.askLumps = false;
	                window.DO_NOT_RPC = true;
	                building.levelUp();
	                window.DO_NOT_RPC = false;
	                Game.prefs.askLumps = oldLumps;
	            });
	            object.levelUp = new raisin_1.Raisin(object.levelUp)
	                .insert(0, function () {
	                if (!this.vanilla)
	                    return [];
	                window.buildingUpgradeRPC.send({ id: this.id });
	            })
	                .insertPerSignature(/(?<!Ga)(?<!miniga)me\./g, `Game.ObjectsById[${object.id}].`, false)
	                .compile();
	        }
	    }
	    function sendDataToPeers(data) {
	        for (var connection in connections) {
	            connections[connection].send(data);
	        }
	    }
	    ;
	    class RPC {
	        modID;
	        name;
	        constructor(modID, name) {
	            this.modID = modID;
	            this.name = name;
	        }
			execute(payload) {
				if (payload) {
					rpcFunctions[this.modID][this.name](payload);
				} else {
					rpcFunctions[this.modID][this.name]();
				}
			}
	        send(payload) {
	            if (window.DO_NOT_RPC)
	                return;
	            sendDataToPeers({
	                type: "rpc",
	                data: {
	                    modID: this.modID,
	                    name: this.name,
	                    payload: payload
	                }
	            });
	        }
	        rpc(payload) {
	            if (window.DO_NOT_RPC)
	                return;
	            this.send(payload);
	            if (payload)
	                rpcFunctions[this.modID][this.name](payload);
	            else
	                rpcFunctions[this.modID][this.name]();
	        }
	        setCallback(callback) {
	            rpcFunctions[this.modID] = rpcFunctions[this.modID] || {};
	            rpcFunctions[this.modID][this.name] = callback;
	            return this;
	        }
	    }
	    exports.RPC = RPC;
	    class SharedVariable extends RPC {
	        #value;
	        settings;
	        subscribers = [];
	        constructor(modID, name, settings) {
	            super(modID, name);
	            this.#value = settings.defaultValue;
	            this.settings = settings;
	            this.setCallback((payload) => {
	                if (payload) {
	                    this.value = payload;
	                }
	                for (var subscriber in this.subscribers) {
	                    this.subscribers[subscriber](this.value);
	                }
	            });
	        }
	        default() {
	            this.value = this.settings.defaultValue;
	        }
	        get value() {
	            return this.#value;
	        }
	        set value(val) {
	            if (this.settings.sanitizer) {
	                if (!this.settings.sanitizer(val))
	                    return;
	            }
	            this.#value = val;
	            this.send(val);
	        }
	        subscribe(callback) {
	            this.subscribers.push(callback);
	            return this;
	        }
	    }
	    exports.SharedVariable = SharedVariable;
	    setInterval(() => {
	        if (netcodeSettings.hosting)
	            sendDataToPeers({
	                type: "macadamiaSync",
	                data: Game.WriteSave(1)
	            });
	    }, netcodeSettings.syncPeriod);
	});
	define("core/core", ["require", "exports", "logs", "core/modManager", "core/multiplayer"], function (require, exports, logs_4, modManager_1, multiplayer_1) {
	    "use strict";
	    Object.defineProperty(exports, "__esModule", { value: true });
	    exports.loadCore = loadCore;
	    const logger = new logs_4.Logger("macadamia::core");
	    async function loadCore() {
	        logger.log("loading core features...");
	        await (0, multiplayer_1.loadMultiplayer)(); // multiplayer
	        await (0, modManager_1.loadModManager)(); // mod manager
	        logger.log("core loaded successfully!");
	    }
	});
	define("mod", ["require", "exports", "core/multiplayer", "hooks", "logs", "raisin"], function (require, exports, multiplayer_2, hooks_1, logs_5, raisin_2) {
	    "use strict";
	    Object.defineProperty(exports, "__esModule", { value: true });
	    exports.Mod = void 0;
	    class Mod {
	        uuid;
	        logger;
	        hooks;
	        constructor(uuid) {
	            this.uuid = uuid;
	            this.logger = new logs_5.Logger(this.uuid);
	            this.hooks = (0, hooks_1.buildHooks)();
	        }
	        async awake() { }
	        async sleep() { }
	        async hookBuilder() { }
	        async rpcBuilder() { }
	        // Helper utils
	        createSharedVariable(name, settings) {
	            return new multiplayer_2.SharedVariable(this.uuid, name, settings);
	        }
	        createRPC(name) {
	            return new multiplayer_2.RPC(this.uuid, name);
	        }
	        createRaisin(func) {
	            return new raisin_2.ModRaisin(this.uuid, func);
	        }
	    }
	    exports.Mod = Mod;
	});
	define("index", ["require", "exports", "cleaner", "core/core", "logs", "mod"], function (require, exports, cleaner_1, core_1, logs_6, mod_1) {
	    "use strict";
	    Object.defineProperty(exports, "__esModule", { value: true });
	    window.Macadamia = {
	        Version: "1.0.0beta",
	        Defaults: {
	        // Defaults for Macadamia will go here.
	        },
	        Mod: mod_1.Mod,
	        async register(mod, manifest) {
	            var currMod = new mod(manifest.uuid);
	            window.MacadamiaModList[manifest.uuid] = {
	                mod: currMod,
	                manifest: manifest,
	                enabled: true
	            };
	            await currMod.rpcBuilder();
	            await currMod.awake();
	            await currMod.hookBuilder();
	            (0, logs_6.log)("macadamia", `registered ${manifest.uuid}.`);
	        },
	        async disableMod(uuid) {
	            if (uuid == "macadamia")
	                return;
	            var mod = window.MacadamiaModList[uuid];
	            if (!mod) {
	                (0, logs_6.log)("macadamia", `mod ${uuid} not found.`);
	                return;
	            }
	            mod.enabled = false;
	            mod.mod.hooks.enabled = false;
	            await mod.mod.sleep();
	            (0, logs_6.log)("macadamia", `disabled ${uuid}.`);
	        },
	        enableMod(uuid) {
	            if (uuid == "macadamia")
	                return;
	            var mod = window.MacadamiaModList[uuid];
	            if (!mod) {
	                (0, logs_6.log)("macadamia", `mod ${uuid} not found.`);
	                return;
	            }
	            mod.enabled = true;
	            mod.mod.hooks.enabled = true;
	            (0, logs_6.log)("macadamia", `enabled ${uuid}.`);
	        },
	        toggleMod(uuid) {
	            if (window.MacadamiaModList[uuid].enabled) {
	                window.Macadamia.disableMod(uuid);
	            }
	            else {
	                window.Macadamia.enableMod(uuid);
	            }
	        },
	        toggleStreamerMode() {
	            if (localStorage.getItem("streamerMode") === "true") {
	                localStorage.setItem("streamerMode", "false");
	            }
	            else {
	                localStorage.setItem("streamerMode", "true");
	            }
	        }
	    };
	    window.MacadamiaModList = { macadamia: { mod: null, manifest: {
	                uuid: "macadamia",
	                name: "Macadamia",
	                description: "Macadamia",
	                author: "RedBigz",
	                version: window.Macadamia.Version,
	                icon: "https://redbigz.com/lfs/macadamia/res/logo.png"
	            }, enabled: true } }; // { [key: string]: { mod: Mod, manifest: { uuid: string; }, enabled: boolean } }
	    async function main() {
	        (0, cleaner_1.clean)();
	        (0, logs_6.init)();
	        await (0, core_1.loadCore)();
	        (0, logs_6.welcome)();
	    }
	    main();
	});
	require(["index"]);
});

var cssList = '';

var availableChars = '1234567890qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM-=[]\\{}|;\'":,./<>+_?!@#$%^&*()`~'.split('').concat(' ').concat('	');

var colorList = ['#ffffff', '#a8ffbf'];

var previousContents = {};

class charRow { 
    constructor(uuid) { 
        this.id = uuid;
        previousContents[uuid] = this;
        
        this.l = window.createTypingDisplay(uuid, colorList[Object.keys(previousContents).length]);
        this.c = [];
    }
    
    removeL() {
        this.l.remove();
    }
}

class char {
	constructor(content, color, parent) {
		this.c = content;
		this.mt = 15 * Game.fps;
		this.mtFulllengthMax = 14 * Game.fps;
		this.t = this.mt;
		this.l = null;
        this.parentL = parent;
        this.margins = 1;
		this.color = color;

		this.createL();
	}

	createL() {
		var div = document.createElement('span');
		div.classList.add('character');
		div.innerText = this.c;
		div.style.color = this.color;
        div.style.margin = this.margins;
		this.l = div;

		this.parentL.appendChild(this.l);
	}

	removeL() {
		this.l.remove();
	}

	scale() {
		return Math.min(this.t / (this.mt - this.mtFulllengthMax), 1)*100;
	}
}

function createTypingDisplayMod() {
    window.addEventListener('keydown', function(e) { if (e.key == ' ') { e.preventDefault(); } });

	window.createTypingDisplay = function(peerid, color) {
		var div = document.createElement('div');
		div.classList.add('typingDisplayContainer');
		div.id = 'typingDisplayContainer';
        div.style.color = color;
		l('typingDisplayMaster').appendChild(div);
        
        return div;
    }
    
    let mdiv = document.createElement('div');
    mdiv.classList.add('typingDisplayMaster');
    mdiv.id = 'typingDisplayMaster';
    l('game').appendChild(mdiv);

	function injectCSS(str) {
		cssList += str + '\n';
	}

	injectCSS('.typingDisplayContainer { z-index: 100000000; transform: translate(-50%, 0%); padding: 5px; border-radius: 5px; background: rgba(0, 0, 0, 0.25); }');
    injectCSS('.typingDisplayMaster { position: absolute; z-index: 1000; left: 50%; bottom: 10%; pointer-events: none; }')
	injectCSS('.character { display: inline-block; margin: 1px; font-size: 15px; }');

	let allStyles = document.createElement('style');
	allStyles.textContent = cssList;
	cssList = '';
	l('game').appendChild(allStyles);

	addEventListener('keydown', function (event) {
		if (!event.ctrlKey && availableChars.includes(event.key)) { MacadamiaModList.tduuid.mod.addChar(event.key); }
	});

	Game.registerHook('logic', function() {
        for (let i in previousContents) {
            let c = previousContents[i];
			if (!c.c.length) { c.l.style.display = 'none'; } else { c.l.style.display = ''; }
			for (let i = 0; i < c.c.length; i++) {
				var me = c.c[i];
				if (!me) { continue; }
				me.t--;
				if (me.t <= 0) { me.removeL(); c.c.shift(); i--; MacadamiaModList.tduuid.mod.charCountOffset++; continue; }
				me.l.style.transform = 'scaleX(' + me.scale() + '%)';
			}
        }
	})

	Game.registerHook('check', function() {
		for (let i in previousContents) {
			if (previousContents[i].c.length == 0) {
				while (previousContents[i].l.firstChild) {
					previousContents[i].l.removeChild(previousContents[i].l.firstChild);
				}
			}
		}
	})

	class TypingDisplay extends Macadamia.Mod {
		async hookBuilder() {
			
		}

		async rpcBuilder() {
			this.charCount = 0;
			this.charCountOffset = 0;

			this.charRPC = this.createRPC("char");
			this.charRPC.setCallback((arg) => {
				const ch = new char(arg.char, arg.color, previousContents[arg.id].l);
				if (arg.char == ' ') { ch.margins = 2; }
				const arr = previousContents[arg.id].c;
				while (arr.length + this.charCountOffset < arg.count - 1) {
					arr.push(null);
				}
				arr[arg.count - 1] = ch;
			});
            
            this.newRowRPC = this.createRPC('newRow');
            this.newRowRPC.setCallback((arg) => {
                new charRow(arg.id);
                //Game.Notify('new row! '+arg.id, '', 0);
                //console.log('new row '+arg.id);
            });
            
            setTimeout(function() { new charRow(window.peer.id); }, 100);
		}
        
        constructDisplayList(connected) { 
            for (let i in previousContents) { 
                previousContents[i].removeL();
            }
            previousContents = {};
            new charRow(window.peer.id);
        	for (let i in connected) { 
                new charRow(connected[i]);
            }
        }

		async awake() {
            
		}

		async sleep() {
			// When your mod is disabled this is called. If you use any other modding APIs make sure you destroy any changes created with them here.
		}

		addChar(key) {
			this.charCount++;
			this.charRPC.send({ id: window.peer.id, char: key, count: this.charCount });
			this.charRPC.execute({ id: window.peer.id, char: key, count: this.charCount });
		}
	}

	Macadamia.register(TypingDisplay, {
		uuid: "tduuid",
		name: "TypingDisplay",
		description: "Displays what you typed onto the screen for all connected players.",
		author: "CursedSliver",
		version: "1.0.0"
	});
}

class mouse {
	constructor(uuid) {
		let ele = document.createElement('div');
		ele.style.backgroundImage = 'url(\'https://cursedsliver.github.io/asdoindwalk/mouse.png\')';
		ele.style.backgroundSize = 'contain';
		ele.style.backgroundRepeat = 'no-repeat';
		ele.style.width = '512px';
		ele.style.height = '512px';
		ele.style.transform = 'scale(0.1) translate(-50%, -50%)';
		ele.style.margin = '-216px -160px'
		ele.style.position = 'absolute';
		ele.style.pointerEvents = 'none';
		ele.style.top = '0px';
		ele.style.left = '0px';
        ele.style.zIndex = 10000000000;
		this.l = ele;
		this.uuid = uuid;
		this.x = 0;
		this.y = 0;

		l('mouseDisplay').appendChild(this.l);
	}

	updatePosition(x, y) {
		x = parseFloat(x);
		y = parseFloat(y);
		//console.log(x, y);
		this.x = x;
		this.l.style.left = Math.round(this.x * l('game').offsetWidth) + 'px';
		this.y = y;
		this.l.style.top = Math.round(this.y * l('game').offsetHeight) + 'px';
	}
}

let lastMovedFrame = Game.T;

function createMouseDisplay() {
	let mouseDisplayLayer = document.createElement('div');
	mouseDisplayLayer.style = 'position: absolute; left: -48px; top: 0px; filter:drop-shadow(0px 4px 4px rgba(0,0,0,0.75)); pointer-events: none; -webkit-filter:drop-shadow(0px 4px 4px rgba(0,0,0,0.75)); z-index: 100000000000;';
	mouseDisplayLayer.id = 'mouseDisplay';
	l('game').appendChild(mouseDisplayLayer);

	window.mouseList = {};


	AddEvent(document, 'mousemove', (e) => {
		if (lastMovedFrame == Game.T) { return; }
		window.MacadamiaModList.mouse.mod.newPosRPC.send({ uuid: window.peer.id, x: Game.mouseX / l('game').offsetWidth, y: Game.mouseY / l('game').offsetHeight });
		lastMovedFrame = Game.T;
	});

	class mouseDisplayMod extends Macadamia.Mod {
		async awake() {
		}

		async rpcBuilder() {
			this.newPosRPC = this.createRPC('mousePosUpdate');
			this.newPosRPC.setCallback((arg) => {
				if (window.mouseList[arg.uuid]) { window.mouseList[arg.uuid].updatePosition(arg.x, arg.y); }
			});

			this.newMouseRPC = this.createRPC('newMouse');
			this.newMouseRPC.setCallback((arg) => {
				window.MacadamiaModList.mouse.mod.addMouse(arg.uuid, arg.x, arg.y);
			});
		}

		initMouses(peerIds) {
			window.mouseList = {};
			for (let i in peerIds) {
				window.mouseList[peerIds[i]] = new mouse(peerIds[i]);
			}
			this.newMouseRPC.send({ uuid: window.peer.id, x: Game.mouseX / l('game').offsetWidth, y: Game.mouseY / l('game').offsetHeight });
		}

		addMouse(peerId, x, y) {
			window.mouseList[peerId] = new mouse(peerId);
			if (typeof x === 'number' && typeof y === 'number') {
				window.mouseList[peerId].updatePosition(x, y);
			}
		}
	}

	Macadamia.register(mouseDisplayMod, {
		uuid: "mouse",
		name: "Mouse display",
		description: "Displays the mouses of all other connected players",
		author: "CursedSliver",
		version: "1.0.0"
	});
}

var isHost = true;
function createGCSyncer() {
	Game.registerHook('logic', () => {
		for (let i in Game.shimmers) {
			if (!Game.shimmers[i].sent) {
				Game.shimmers[i].sent = true;
				window.sendShimmerRPC.call(Game.shimmers[i]);
			}
		}
	}); //obligatory one frame delay yay!!!
	//screw raisins those suck so much

	class GCSyncer extends Macadamia.Mod {
		async hookBuilder() {
			eval('Game.updateShimmers='+Game.updateShimmers.toString().replace('//cookie storm!', `if (!netcodeSettingsExport.hosting) { return; } //cookie storm!`));
			Game.shimmer.prototype.getForceObjString = function() {
				//gets a string representation for rpc purposes
				//honestly idk what forceobj is used for so I just left it blank
				let str = '';
				return str;
			}
			Game.shimmer.prototype.modifyPayload = function(obj) {
				if (this.type == 'golden') {
					obj.wrath = this.wrath;
                    
				}
				obj.dur = this.dur;
                obj.spawnLead = this.spawnLead;
			}

			window.sendShimmerRPC = function() {
				let obj = {
					x: this.x,
					y: this.y,
					id: this.id,
					force: this.force,
					type: this.type,
					noCount: this.noCount,
					backgroundImage: this.l.style.backgroundImage,
					forceObj: this.getForceObjString()
				};
				this.modifyPayload(obj);
				MacadamiaModList.gcsy.mod.shimmerSpawnRPC.send(obj);
			};

			Game.shimmer.prototype.pop = this.createRaisin(Game.shimmer.prototype.pop).insert(0, () => { window.MacadamiaModList.gcsy.mod.shimmerPopRPC.send({ id: this.id }); }).compile();
            
            Game.killShimmers = this.createRaisin(Game.killShimmers).insert(0, () => { window.MacadamiaModList.gcsy.mod.killShimmersRPC.send(); }).compile();

			Game.Popup = this.createRaisin(Game.Popup).insert(0, (text, x, y) => { if (Game.popups) { window.MacadamiaModList.gcsy.mod.popupRPC.send({ text: text, x: x, y: y }); } }).compile();

			Game.gainBuff = this.createRaisin(Game.gainBuff).insert(0, (type, time, arg1, arg2, arg3) => { window.MacadamiaModList.gcsy.mod.gainBuffRPC.send({ type: type, time: time, arg1: arg1, arg2: arg2, arg3: arg3 }); }).compile();

			Game.killBuff = this.createRaisin(Game.killBuff).insert(0, (what) => { window.MacadamiaModList.gcsy.mod.killBuffRPC.send({ buff: what }); }).compile();
            
            Game.killBuffs = this.createRaisin(Game.killBuffs).insert(0, () => { window.MacadamiaModList.gcsy.mod.killBuffsRPC.send(); }).compile();

			Game.Earn = this.createRaisin(Game.Earn).insert(0, (howmuch) => { window.MacadamiaModList.gcsy.mod.earnRPC.send({ n: parseInt(howmuch) }); }).compile();

			Game.Notify = this.createRaisin(Game.Notify).insert(0, (title, desc, pic, quick, noLog) => { if (Game.popups) { window.MacadamiaModList.gcsy.mod.notifRPC.send({ title: title, text: desc, iconX: Array.isArray(pic)?pic[0]:null, iconY: pic[1], iconPic: pic[2], quick: quick, noLog: noLog }); } }).compile();

			//make it so that non-hosts cant generate achievement or game saved notifs

			AddEvent(l('prefsButton'),'click',function(){ window.MacadamiaModList.gcsy.mod.openMenuRPC.send({ menu: 'prefs' }); });
			AddEvent(l('statsButton'),'click',function(){ window.MacadamiaModList.gcsy.mod.openMenuRPC.send({ menu: 'stats' }); });
			AddEvent(l('logButton'),'click',function(){ window.MacadamiaModList.gcsy.mod.openMenuRPC.send({ menu: 'log' }); });

			Game.ClosePrompt = this.createRaisin(Game.ClosePrompt).insert(0, () => { window.MacadamiaModList.gcsy.mod.closePromptRPC.send(); }).compile();

			Game.Prompt = this.createRaisin(Game.Prompt).insert(0, (content, options, updateFunc, style ) => { window.MacadamiaModList.gcsy.mod.promptRPC.send({ content: content, options: options, updateFunc: (updateFunc?updateFunc.toString():''), style: style }); }).compile();

			AddEvent(l('commentsText1'),'click',function() { window.MacadamiaModList.gcsy.mod.tickerRPC.send(); });

			Game.ToggleSpecialMenu = this.createRaisin(Game.ToggleSpecialMenu).insert(0, (on) => {  window.MacadamiaModList.gcsy.mod.toggleSpecialRPC.send({ on: on, tab: Game.specialTab }); }).compile();

			eval('Game.SelectDragonAura='+Game.SelectDragonAura.toString().replace(`(slot==0?'Game.dragonAura':'Game.dragonAura2')+'=Game.SelectingDragonAura;'`, `(slot==0?'Game.dragonAura':'Game.dragonAura2')+'=Game.SelectingDragonAura; window.MacadamiaModList.gcsy.mod.confirmAuraRPC.send({ slot: '+slot+', aura: Game.SelectingDragonAura });'`));
			Game.SelectDragonAura = this.createRaisin(Game.SelectDragonAura).insert(0, (slot) => { window.MacadamiaModList.gcsy.mod.selectAuraRPC.send({ slot: slot }); }).compile();

			Game.SetDragonAura = this.createRaisin(Game.SetDragonAura).insert(0, (aura, slot) => { window.MacadamiaModList.gcsy.mod.setAuraRPC.send({ aura: aura, slot: slot }); }).compile();

			for (let i in Game.Objects) {
				eval('Game.Objects["'+i+'"].buyFree='+Game.Objects[i].buyFree.toString().replace('>=price', '>=this.price'));
				Game.Objects[i].buyFree = this.createRaisin(Game.Objects[i].buyFree).insert(0, (amount) => { window.MacadamiaModList.gcsy.mod.buyFreeRPC.send({ amount: amount, building: this.name }); }).compile();
				Game.Objects[i].sacrifice = this.createRaisin(Game.Objects[i].sacrifice).insert(0, (amount) => { window.MacadamiaModList.gcsy.mod.sacrificeBuildingRPC.send({ amount: amount, building: this.name }); }).compile();
			}
		}

		async rpcBuilder() {
			this.shimmerSpawnRPC = this.createRPC('shimmerSpawn');
			this.shimmerSpawnRPC.setCallback((arg) => {
				//arg format: x, y, type, id, force, noCount, backgroundImage, forceObj (from getString), other stuff from modifyPayload
				let s = new Game.shimmer(arg.type, null, arg.noCount);
				s.x = arg.x;
				s.y = arg.y;
				s.id = arg.id;
				s.force = arg.force;
				s.l.style.backgroundImage = arg.backgroundImage;
                if (arg.spawnLead) { s.spawnLead = arg.spawnLead; }
				s.dur = arg.dur;
				s.life = Math.ceil(arg.dur * Game.fps);
				if (s.type == 'golden') { s.wrath = arg.wrath; }
				s.sent = true;
			});

			this.shimmerPopRPC = this.createRPC('shimmerPop')
			this.shimmerPopRPC.setCallback((arg) => {
				for (let i in Game.shimmers) {
					if (Game.shimmers[i].id == arg.id) {
						Game.shimmers[i].die();
						break;
					}
				}
			});
            
            this.killShimmersRPC = this.createRPC('killShimmers');
            this.killShimmersRPC.setCallback(() => {
                window.DO_NOT_RPC = true;
                Game.killShimmers();
                window.DO_NOT_RPC = false;
            });

			this.popupRPC = this.createRPC('popup');
			this.popupRPC.setCallback((arg) => {
				Game.textParticlesAdd(arg.text,0,arg.x,arg.y);
			});

			this.gainBuffRPC = this.createRPC('gainBuff');
			this.gainBuffRPC.setCallback((arg) => {
				window.DO_NOT_RPC = true;
				Game.gainBuff(arg.type, arg.time, arg.arg1, arg.arg2, arg.arg3);
				window.DO_NOT_RPC = false;
			});
			
			this.killBuffRPC = this.createRPC('killBuff');
			this.killBuffRPC.setCallback((arg) => {
				window.DO_NOT_RPC = true;
				Game.killBuff(arg.buff);
				window.DO_NOT_RPC = false;
			});
            
         	this.killBuffsRPC = this.createRPC('killBuffs');
			this.killBuffsRPC.setCallback(() => {
				window.DO_NOT_RPC = true;
				Game.killBuffs();
				window.DO_NOT_RPC = false;
			});

			this.earnRPC = this.createRPC('earn');
			this.earnRPC.setCallback((howmuch) => {
				Game.cookies += howmuch.n;
				Game.cookiesEarned += howmuch.n;
			});

			this.notifRPC = this.createRPC('notifs');
			this.notifRPC.setCallback((arg) => {
				window.DO_NOT_RPC = true;
				let arr = [arg.iconX, arg.iconY];
				if (arg.iconPic) { arr.push(arg.iconPic); }
				if (typeof arg.iconX === 'undefined') { arr = 0; }
				Game.Notify(arg.title, arg.text, arr, arg.quick, arg.noLog);
				window.DO_NOT_RPC = false;
			});

			this.openMenuRPC = this.createRPC('openMenu');
			this.openMenuRPC.setCallback((arg) => {
				Game.ShowMenu(arg.menu);
			});

			this.closePromptRPC = this.createRPC('closePrompt');
			this.closePromptRPC.setCallback(() => {
				window.DO_NOT_RPC = true;
				Game.ClosePrompt();
				window.DO_NOT_RPC = false;
			});

			this.promptRPC = this.createRPC('prompt');
			this.promptRPC.setCallback((arg) => {
				window.DO_NOT_RPC = true;
				Game.Prompt(arg.content, arg.options, arg.updateFunc?(new Function('let hhhhhh = ' + arg.updateFunc + ' hhhhhh(); ')):0, arg.style); 
				window.DO_NOT_RPC = false;
			});

			this.tickerRPC = this.createRPC('ticker');
			this.tickerRPC.setCallback(() => {
				window.DO_NOT_RPC = true;
				l('commentsText1').click();
				window.DO_NOT_RPC = false;
			});

			this.toggleSpecialRPC = this.createRPC('toggleSpecial');
			this.toggleSpecialRPC.setCallback((arg) => {
				Game.specialTab = arg.tab;
				window.DO_NOT_RPC = true;
				Game.ToggleSpecialMenu(arg.on);
				window.DO_NOT_RPC = false;
			});

			this.selectAuraRPC = this.createRPC('selectAura');
			this.selectAuraRPC.setCallback((arg) => {
				window.DO_NOT_RPC = true;
				Game.SelectDragonAura(arg.slot, 0);
				window.DO_NOT_RPC = false;
			});

			this.setAuraRPC = this.createRPC('setAura');
			this.setAuraRPC.setCallback((arg) => {
				Game.SelectingDragonAura = arg.aura;
                //Game.Notify('Aura set: '+arg.aura, '', 0);
                window.DO_NOT_RPC = true;
				Game.SelectDragonAura(arg.slot,1);
                window.DO_NOT_RPC = false;
                //Game.Notify('Current aura: '+Game.SelectingDragonAura, '', 0);
			});

			this.confirmAuraRPC = this.createRPC('confirmAura');
			this.confirmAuraRPC.setCallback((arg) => {
				if (arg.slot == 0) { 
					Game.dragonAura = arg.aura;
				} else {
					Game.dragonAura2 = arg.aura;
				}
                //Game.Notify('Aura confirmed: '+Game.SelectingDragonAura, '', 0);
			});

			this.buyFreeRPC = this.createRPC('buyFree');
			this.buyFreeRPC.setCallback((arg) => {
				window.DO_NOT_RPC = true;
				Game.Objects[arg.building].buyFree(arg.amount);
				window.DO_NOT_RPC = false;
			});

			this.sacrificeBuildingRPC = this.createRPC('sacrificeBuilding');
			this.sacrificeBuildingRPC.setCallback((arg) => {
				window.DO_NOT_RPC = true;
				Game.Objects[arg.building].sacrifice(arg.amount);
				window.DO_NOT_RPC = false;
			});
		}
	}

	Macadamia.register(GCSyncer, {
		uuid: "gcsy",
		name: "Shimmer integration",
		description: "Syncs golden cookie behaviors across all current players... alongside some other things",
		author: "CursedSliver",
		version: "1.0.0"
	});
}

function createMinigameSyncer() {
	class minigameSyncer extends Macadamia.Mod {
		async hookBuilder() {
			this.syncGarden();
			this.syncStocks();
			this.syncPantheon();
			this.syncGrimoire();
		}

		syncGarden() {
            if (!Game.Objects.Farm.minigameLoaded) { setTimeout(function() { MacadamiaModList.minigames.mod.syncGarden(); }, 20); return; }
            
			let M = Game.Objects['Farm'].minigame;

			eval('M.clickTile='+M.clickTile.toString().replace('//', 'MacadamiaModList.minigames.mod.clickTileRPC.send({ x: x, y: y, shift: Game.keys[16], seedHolding: M.seedSelected }) //'));
			M.buildPlot();

			eval('M.buildPanel='+M.buildPanel.toString().replace('if (/* !M.freeze && */G', 'MacadamiaModList.minigames.mod.clickSeedRPC.send({ id: me.id }); if (/* !M.freeze && */G').replace('M.nextSoil=Date.now()', 'MacadamiaModList.minigames.mod.soilRPC.send({ id: me.id }); M.nextSoil=Date.now()'));
			eval('M.tools.harvestAll.func='+M.tools.harvestAll.func.toString().replace('PlaySound', 'MacadamiaModList.minigames.mod.harvestAllRPC.send(); PlaySound'));
			eval('M.tools.freeze.func='+M.tools.freeze.func.toString().replace('//if (!M.freeze && M.nextFreeze>Date.now()) return false;', 'MacadamiaModList.minigames.mod.freezeRPC.send(); //if (!M.freeze && M.nextFreeze>Date.now()) return false;'));
			eval('M.convert='+M.convert.toString().replace('M.harvestAll();', 'MacadamiaModList.minigames.mod.sacrificeRPC.send(); M.harvestAll();'));
			M.buildPanel();

			eval('M.logic='+M.logic.toString().replace('M.computeBoostPlot();', 'if (!netcodeSettingsExport.hosting) { return; } M.computeBoostPlot();').replace('if (M.toCompute) M.computeEffs(); if (netcodeSettingsExport.hosting) { MacadamiaModList.minigames.mod.plotSyncRPC.send({ code: M.exportPlot() }); }'));

			M.exportPlot = function() {
				let str = '';
				for (var y = 0; y < 6; y++) {
					for (var x = 0; x < 6; x++) {
						str += parseInt(M.plot[y][x][0]) + ':' + parseInt(M.plot[y][x][1]) + ':';
					}
				}
				return str;
			}

			M.importPlot = function(str) {
				let plot = str.split(':');
				var n = 0;
				for (var y = 0; y < 6; y++) {
					for (var x = 0; x < 6; x++) {
						M.plot[y][x] = [parseInt(plot[n]), parseInt(plot[n + 1])];
						n += 2;
					}
				}
				M.buildPlot();
				M.buildPanel();
			}
            
            AddEvent(M.lumpRefill, 'click', function() { MacadamiaModList.minigames.mod.gardenRefillRPC.send(); });
 		}

		syncStocks() {
            if (!Game.Objects.Bank.minigameLoaded) { setTimeout(function() { MacadamiaModList.minigames.mod.syncStocks(); }, 20); return; }
            
			//only gonna sync the loans
			let M = Game.Objects['Bank'].minigame;

			for (let i = 1; i <= 3; i++) {
				AddEvent(l('bankLoan'+i), 'click', function() { MacadamiaModList.minigames.mod.loanRPC.send({ id: i, interest: 0 }); });
			}
			Game.takeLoan = M.takeLoan;
		}

		syncPantheon() {
            if (!Game.Objects.Temple.minigameLoaded) { setTimeout(function() { MacadamiaModList.minigames.mod.syncPantheon(); }, 20); return; }
            
			//only gonna sync god slotting and unslotting
			let M = Game.Objects['Temple'].minigame;

			eval('M.dropGod='+M.dropGod.toString().replace('var div', 'MacadamiaModList.minigames.mod.dropGodRPC.send({ dragging: M.dragging, slotHovered: M.slotHovered }); var div'));
            
            AddEvent(M.lumpRefill, 'click', function() { MacadamiaModList.minigames.mod.pantheonRefillRPC.send(); });
		}
		
		syncGrimoire() {
            if (!Game.Objects['Wizard tower'].minigameLoaded) { setTimeout(function() { MacadamiaModList.minigames.mod.syncGrimoire(); }, 20); return; }
            
			let M = Game.Objects['Wizard tower'].minigame;

			eval('M.castSpell='+M.castSpell.toString().replace('M.magic=Math.max(0,M.magic);', 'M.magic=Math.max(0,M.magic); MacadamiaModList.minigames.mod.syncMagicRPC.send({ magic: M.magic }); MacadamiaModList.minigames.mod.castSpellRPC.send({ passthrough: (spell.passthrough || obj.passthrough) });'));
			eval('M.logic='+M.logic.toString().replace('M.magic+=M.magicPS;', 'if (netcodeSettingsExport.hosting) { M.magic+=M.magicPS; MacadamiaModList.minigames.mod.syncMagicRPC.send({ magic: M.magic }); }'))

			eval('M.spells["stretch time"].win='+M.spells['stretch time'].win.toString().replace('var changed=0;', 'var changed=0; MacadamiaModList.minigames.mod.stSuccessRPC.send();')); 
			eval('M.spells["stretch time"].fail='+M.spells['stretch time'].fail.toString().replace('var changed=0;', 'var changed=0; MacadamiaModList.minigames.mod.stBackfireRPC.send();')); 
            
            AddEvent(M.lumpRefill, 'click', function() { MacadamiaModList.minigames.mod.grimoireRefillRPC.send(); });
		}

		async rpcBuilder() {
			this.clickTileRPC = this.createRPC('clickTile');
			this.clickTileRPC.setCallback((arg) => {
				window.DO_NOT_RPC = true;
                let prevShift = Game.keys[16];
                if (arg.shift) { Game.keys[16] = 1; }
                Game.Objects.Farm.minigame.seedHolding = arg.seedHolding;
				Game.Objects.Farm.minigame.clickTile(arg.x, arg.y);
                if (prevShift) { Game.keys[16] = prevShift; }
				window.DO_NOT_RPC = false;
			});

			this.clickSeedRPC = this.createRPC('clickSeed');
			this.clickSeedRPC.setCallback((arg) => {
				window.DO_NOT_RPC = true;
				l('gardenSeed-'+arg.id).click();
				window.DO_NOT_RPC = false;
			});

			this.harvestAllRPC = this.createRPC('harvestAll');
			this.harvestAllRPC.setCallback(() => {
				window.DO_NOT_RPC = true;
				l('gardenTool-1').click();
				window.DO_NOT_RPC = false;
			});

			this.freezeRPC = this.createRPC('freeze');
			this.freezeRPC.setCallback(() => {
				window.DO_NOT_RPC = true;
				l('gardenTool-2').click();
				window.DO_NOT_RPC = false;
			});

			this.sacrificeRPC = this.createRPC('sacrifice');
			this.sacrificeRPC.setCallback(() => {
				window.DO_NOT_RPC = true;
				Game.Objects.Farm.minigame.convert();
				window.DO_NOT_RPC = false;
			});

			this.soilRPC = this.createRPC('soil');
			this.soilRPC.setCallback((arg) => {
				window.DO_NOT_RPC = true;
				l('gardenSoil-'+arg.id).click();
				window.DO_NOT_RPC = false;
			});

			this.plotSyncRPC = this.createRPC('plotSync');
			this.plotSyncRPC.setCallback((arg) => {
				//console.log(arg.code);
				Game.Objects.Farm.minigame.importPlot(arg.code);
			});

			this.loanRPC = this.createRPC('loan');
			this.loanRPC.setCallback((arg) => {
				window.DO_NOT_RPC = true;
				Game.Objects.Bank.minigame.takeLoan(arg.id, arg.interest);
				window.DO_NOT_RPC = false;
			});
			
			this.syncMagicRPC = this.createRPC('syncMagic');
			this.syncMagicRPC.setCallback((arg) => {
				Game.Objects['Wizard tower'].minigame.magic = arg.magic;
			});

			this.stSuccessRPC = this.createRPC('stSuccess');
			this.stSuccessRPC.setCallback(() => {
				for (var i in Game.buffs)
				{
					var me=Game.buffs[i];
					var gain=Math.min(Game.fps*60*5,me.maxTime*0.1);
					me.maxTime+=gain;
					me.time+=gain;
				}
			});

			this.stBackfireRPC = this.createRPC('stBackfire');
			this.stBackfireRPC.setCallback(() => {
				for (var i in Game.buffs)
				{
					var me=Game.buffs[i];
					var loss=Math.min(Game.fps*60*10,me.time*0.2);
					me.time-=loss;
					me.time=Math.max(me.time,0);
				}
			});

			this.castSpellRPC = this.createRPC('castSpell');
			this.castSpellRPC.setCallback((arg) => {
				if (!arg.passthrough) {
					Game.Objects['Wizard tower'].minigame.spellsCast++;
					Game.Objects['Wizard tower'].minigame.spellsCastTotal++;
				}
			});

			this.dropGodRPC = this.createRPC('dropGod');
			this.dropGodRPC.setCallback((arg) => {
				let M = Game.Objects.Temple.minigame;
                
                Game.Objects.Temple.minigame.slot=[Game.Objects.Temple.minigame.slot[0],Game.Objects.Temple.minigame.slot[1],Game.Objects.Temple.minigame.slot[2]];

				const prevDrag = M.dragging;
				const prevSlotHovered = M.slotHovered;
				M.dragging = arg.dragging;
				M.slotHovered = arg.slotHovered;
				window.DO_NOT_RPC = true;
				M.dropGod();
				window.DO_NOT_RPC = false;
				M.dragging = prevDrag;
				M.slotHovered = prevSlotHovered;
			});
            
            this.gardenRefillRPC = this.createRPC('gardenRefill');
            this.gardenRefillRPC.setCallback(() => {
                window.DO_NOT_RPC = true;
                Game.Objects.Farm.minigame.lumpRefill.click();
                window.DO_NOT_RPC = false;
            });
            
            this.pantheonRefillRPC = this.createRPC('pantheonRefill');
            this.pantheonRefillRPC.setCallback(() => {
                window.DO_NOT_RPC = true;
                Game.Objects.Temple.minigame.lumpRefill.click();
                window.DO_NOT_RPC = false;
            });
            
            this.grimoireRefillRPC = this.createRPC('grimoireRefill');
            this.grimoireRefillRPC.setCallback(() => {
                window.DO_NOT_RPC = true;
                Game.Objects['Wizard tower'].minigame.lumpRefill.click();
                window.DO_NOT_RPC = false;
            });
		}
	}

	Macadamia.register(minigameSyncer, {
		uuid: "minigames",
		name: "Minigame integration",
		description: "Syncs all minigame behavior.",
		author: "CursedSliver",
		version: "1.0.0"
	});
}

var intervaltest = setInterval(function() { 
	if (typeof MacadamiaModList === 'object' && MacadamiaModList.macadamia) { 
		createTypingDisplayMod(); 
		createMouseDisplay();
		createGCSyncer(); 
		createMinigameSyncer();
		if (typeof toLoad666 != 'undefined' && toLoad666) { setTimeout(function() { Game.LoadMod("https://glander.club/asjs/Hjs3ULwZ/"); }, 2000); }
		clearInterval(intervaltest); 
	} 
}, 10);