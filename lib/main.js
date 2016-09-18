'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _socket = require('./socket');

var _socket2 = _interopRequireDefault(_socket);

var _monkey = require('./monkey');

var _monkey2 = _interopRequireDefault(_monkey);

var _listener = require('./listener');

var _listener2 = _interopRequireDefault(_listener);

var _challenger = require('./challenger');

var _challenger2 = _interopRequireDefault(_challenger);

var _defaults = require('./defaults');

var _defaults2 = _interopRequireDefault(_defaults);

var _botmanager = require('./botmanager');

var _botmanager2 = _interopRequireDefault(_botmanager);

var _battlemanager = require('./battlemanager');

var _battlemanager2 = _interopRequireDefault(_battlemanager);

var _spawner = require('./spawner');

var _spawner2 = _interopRequireDefault(_spawner);

var _log = require('./log');

var _log2 = _interopRequireDefault(_log);

var _decisions = require('./decisions');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var challenger = void 0;
// import {random} from './team';

var myconnection = void 0;

/**
 * This is kind of crappy, but this helps out with testing. When you're using
 * nodemon for 'livereload'-ish functionality, you want to close your connection
 * before you do anything.
 *
 * @param  {Object} options Options object with these properties:
 *                          cleanup: run cleanup task
 *                          exit: exit the process after you're done
 * @param  {Object} err     The JS error message if there is one.
 *
 */
function exitHandler(options, err) {
  if (err) console.error(err.stack);
  if (challenger) challenger.cancelOutstandingChallenges();
  _spawner2.default.kill();
  setTimeout(function () {
    if (myconnection) myconnection.close();
    if (options.exit) process.exit();
  }, 100);
}

/**
 * Show the help menu.
 */
function _displayHelp() {
  console.log('\nLeftovers Again: interface for Pokemon Showdown bots\n\n-bot [path]:     path to your bot class. REQUIRED.\n-h, --help:      show this menu\n-ajax:           don\'t use this\n-monkey:         listen to userscripts instead of connecting to a server\n-loglevel [1-5]: level of severity of logs to show. higher levels are more\n                 verbose. default 3.\n-opponent [path]: Spawn a specific opponent via a child process.\n-scrappy:       Have your bot pick fights with anyone who\'s in the lobby or\n                 who joins the lobby.\n');
}

/**
 * argv: i.e., process.argv
 */
var start = function start(metadata, Bot) {
  // process cmdline args
  var args = require('minimist')(process.argv.slice(2));

  if (args.help || args.h) {
    _displayHelp();
    process.exit();
  }

  if (args.opponent) {
    _spawner2.default.spawn(args.opponent);
    // auto-set scrappy
    args.scrappy = true;
  }

  if (args.monkey) {
    myconnection = _monkey2.default;
  } else {
    myconnection = _socket2.default;
  }

  if (args.loglevel) {
    _log2.default.setLogLevel(args.loglevel);
  }

  // const firstArg = (args._ && args._[0]) ? args._[0] : null;
  // const botpath = args.bot || firstArg || defaults.bot;
  var info = new _botmanager2.default(metadata, Bot);

  // for everything else, check args, then bot info, then defaults.
  // lots of these, you wouldn't really want them in bot info, but eh, whatever.
  var params = ['scrappy', 'format', 'nickname', 'password', 'server', 'port', 'matches'];
  params.forEach(function (param) {
    args[param] = args[param] || info[param] || _defaults2.default[param];
  });

  // create some necessary classes
  challenger = new _challenger2.default(myconnection, info, args);

  // battlemanager is going to create new battles as we learn about them.
  // for each one, it creates a new instance of a battle and of our AI class.
  // listener needs to know about the BattleManager to properly relay battle
  // messages to the right battle instance.
  var battlemanager = new _battlemanager2.default(info.BotClass);
  _listener2.default.use(battlemanager);

  // connect to a server, or create one and start listening.
  myconnection.connect(args);

  // do something when app is closing
  process.on('exit', exitHandler.bind(null, { cleanup: true }));

  // catches ctrl+c event
  process.on('SIGINT', exitHandler.bind(null, { exit: true }));

  // catches uncaught exceptions
  process.on('uncaughtException', exitHandler.bind(null, { exit: true }));
};

exports.default = { start: start, MOVE: _decisions.MOVE, SWITCH: _decisions.SWITCH };