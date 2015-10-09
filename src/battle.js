import config from './config';
import connection from './connection';
import BattleStore from './model/battlestore';

import log from './log';
import {MOVE, SWITCH} from './decisions';


class Battle {
  constructor(bid) {
    // battle ID
    // console.log('battle constructed with id', bid);
    this.bid = bid;

    this.turn = 0;

    this.handlers = {
      // '-damage': this.handleDamage,
      // player: this.handlePlayer,
      teampreview: this.handleTeamPreview,
      poke: this.handlePoke,
      switch: this.handleSwitch,
      request: this.handleRequest,
      turn: this.handleTurn,
      // start: this.handleStart,
      win: this.handleWin,
      // faint: this.handleFaint,
    };

    const AI = require(config.botPath);
    this.bot = new AI();

    this.store = new BattleStore();
  }

  myBot() {
    return this.bot;
  }


  handle(type, message) {
    if (this.handlers[type]) {
      this.handlers[type].apply(this, message);
    }
  }

  // handleFaint(ident) {
  //   // this.store.handleDeath(ident);
  // }

  // // |-damage|p2a: Noivern|188/261|[from] item: Life Orb
  // handleDamage(victim, condition, explanation) {

  // }


  handlePoke(ordinal, mon) {
    // if (this.ord = ordinal) return;
    const nameAndGender = mon.split(', ');
    this.processMon({
      ident: ordinal + ': ' + nameAndGender[0],
      owner: ordinal,
      species: nameAndGender[0],
      gender: nameAndGender[1]
    });
  }

  handleTeamPreview() {
    this.decide();
  }

  /**
   * Handles 'switch' messages. These are important because the request doesn't
   * tell us anything about our opponent, so we need to build and maintain a model
   * of the opponent's pokemon.
   *
   * @param  {[type]} message [description]
   * @return {[type]}         [description]
   */
  handleSwitch(ident, details, condition) {
    this.store._recordIdent(ident);
  }

  handleRequest(json) {
    const data = JSON.parse(json);

    // this is not a request, just data.
    if (!data.rqid) {
      return false;
    }

    // do what it says.
    if (data.wait) {
      return false;
    }

    this.store.interpretRequest(data);

    if (data.forceSwitch || data.teamPreview) {
      this.decide();
    }
  }

  handleTurn(x) {
    if (x !== this.turn + 1) {
      log.error('weird turn number ' + x + ' (I thought it would be ' + this.turn + 1);
    }
    this.turn = x;

    this.decide();
  }

  handleWin(x) {
    console.log('WON: ', x);
  }

  decide() {
    const currentState = this.store.data();
    const choice = this.myBot().onRequest(currentState);

    const res = Battle._formatMessage(this.bid, choice, currentState);
    console.log(res);
    connection.send( res );
  }


  static _formatMessage(bid, choice, state) {
    let verb;
    // if (!Array.isArray(choice)) {
    //   choice = [choice]; // eslint-disable-line
    // }
    if (choice instanceof MOVE) {
      const moveIdx = Battle._lookupMoveIdx(state.self.active.moves, choice.id);
      verb = '/move ' + (moveIdx + 1);
    } else if (choice instanceof SWITCH) {
      verb = (state.teamPreview)
        ? '/team '
        : '/switch ';
      const monIdx = Battle._lookupMonIdx(state.self.reserve, choice.id);
      verb = verb + (monIdx + 1);
    }
    return `${bid}|${verb}|${state.rqid}`;
  }

  static _lookupMoveIdx(moves, idx) {
    if (typeof(idx) === 'number') {
      return idx;
    } else if (typeof(idx) === 'object') {
      return moves.indexOf(idx);
    } else if (typeof(idx) === 'string') {
      return moves.findIndex( (move) => {
        return move.name === idx;
      });
    }
  }

  static _lookupMonIdx(mons, idx) {
    switch (typeof(idx)) {
    case 'number':
      return idx;
    case 'object':
      return mons.indexOf(idx);
    case 'string':
      return mons.findIndex( (mon) => {
        return mon.species === idx;
      });
    default:
      throw new Exception('not a valid choice!', idx);
    }
  }

  processMon() {
    return null;
  }


}

export default Battle;
