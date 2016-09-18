'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typechart = require('../game/typechart');

var _typechart2 = _interopRequireDefault(_typechart);

var _damage = require('../game/damage');

var _damage2 = _interopRequireDefault(_damage);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var KO = function () {
  function KO() {
    _classCallCheck(this, KO);
  }

  _createClass(KO, null, [{
    key: 'predictKO',

    /**
     * Predicts the number of turns it will take to KO a Pokemon, if we
     * continuously use the same move on said Pokemon.
     *
     * This uses current HP, not maximum HP as you usually see on the official
     * damage calculator.
     *
     * @param  {[number]} damage An array of possible damage amounts, from low
     * to high.
     * @param  {Pokemon} defender The targer Pokemon. Should have the following
     * properties:
     *   maxHP (required): the mon's maximum HP
     *   type1: the mon's primary type
     *   type2: the mon's secondary type
     *   item: the defender's item
     *   ability: the defender's ability
     *   toxicCounter: the number of times this mon has taken poison damage
     * @param  {string} field The field
     * @param  {number} hits The number of hits done by this move
     * @param  {booleam} isBadDreams True if the move is bad dreams(?)
     *
     * @return {object} An object with the following properties:
     * turns: the number of turns it will take to possibly KO the opponent
     * chance: the chance the opponent will be KO'ed after that many turns, as
     * a percentage (1-100)
     */
    value: function predictKO(damage, defender) {
      var field = arguments.length <= 2 || arguments[2] === undefined ? '' : arguments[2];
      var hits = arguments.length <= 3 || arguments[3] === undefined ? 1 : arguments[3];
      var isBadDreams = arguments.length <= 4 || arguments[4] === undefined ? false : arguments[4];

      if (isNaN(damage[0])) {
        return {
          turns: null,
          chance: null
        };
      }
      if (damage[damage.length - 1] === 0) {
        return {
          turns: null,
          chance: null
        };
      }

      if (!defender.hp || !defender.maxhp) {
        defender = _damage2.default.assumeStats(defender);
      }

      if (damage[0] >= defender.hp) {
        return {
          turns: 1,
          chance: 100
        };
      }

      var hazards = 0;
      if (field.isSR && defender.ability !== 'Magic Guard') {
        var effectiveness = _typechart2.default.compare('Rock', defender.types);
        hazards += Math.floor(effectiveness * defender.maxhp / 8);
      }
      if ([defender.type1, defender.type2].indexOf('Flying') === -1 && ['Magic Guard', 'Levitate'].indexOf(defender.ability) === -1 && defender.item !== 'Air Balloon') {
        if (field.spikes === 1) {
          hazards += Math.floor(defender.maxhp / 8);
        } else if (field.spikes === 2) {
          hazards += Math.floor(defender.maxhp / 6);
        } else if (field.spikes === 3) {
          hazards += Math.floor(defender.maxhp / 4);
        }
      }
      if (isNaN(hazards)) {
        hazards = 0;
      }

      var eot = 0;
      if (field.weather === 'Sun') {
        if (defender.ability === 'Dry Skin' || defender.ability === 'Solar Power') {
          eot -= Math.floor(defender.maxhp / 8);
        }
      } else if (field.weather === 'Rain') {
        if (defender.ability === 'Dry Skin') {
          eot += Math.floor(defender.maxhp / 8);
        } else if (defender.ability === 'Rain Dish') {
          eot += Math.floor(defender.maxhp / 16);
        }
      } else if (field.weather === 'Sand') {
        if (['Rock', 'Ground', 'Steel'].indexOf(defender.type1) === -1 && ['Rock', 'Ground', 'Steel'].indexOf(defender.type2) === -1 && ['Magic Guard', 'Overcoat', 'Sand Force', 'Sand Rush', 'Sand Veil'].indexOf(defender.ability) === -1 && defender.item !== 'Safety Goggles') {
          eot -= Math.floor(defender.maxhp / 16);
        }
      } else if (field.weather === 'Hail') {
        if (defender.ability === 'Ice Body') {
          eot += Math.floor(defender.maxhp / 16);
        } else if (defender.type1 !== 'Ice' && defender.type2 !== 'Ice' && ['Magic Guard', 'Overcoat', 'Snow Cloak'].indexOf(defender.ability) === -1 && defender.item !== 'Safety Goggles') {
          eot -= Math.floor(defender.maxhp / 16);
        }
      }
      if (defender.item === 'Leftovers') {
        eot += Math.floor(defender.maxhp / 16);
      } else if (defender.item === 'Black Sludge') {
        if (defender.type1 === 'Poison' || defender.type2 === 'Poison') {
          eot += Math.floor(defender.maxhp / 16);
        } else if (defender.ability !== 'Magic Guard' && defender.ability !== 'Klutz') {
          eot -= Math.floor(defender.maxhp / 8);
        }
      }
      if (field.terrain === 'Grassy') {
        if (field.isGravity || defender.type1 !== 'Flying' && defender.type2 !== 'Flying' && defender.item !== 'Air Balloon' && defender.ability !== 'Levitate') {
          eot += Math.floor(defender.maxhp / 16);
        }
      }
      var toxicCounter = 0;
      if (defender.status === 'Poisoned') {
        if (defender.ability === 'Poison Heal') {
          eot += Math.floor(defender.maxhp / 8);
        } else if (defender.ability !== 'Magic Guard') {
          eot -= Math.floor(defender.maxhp / 8);
        }
      } else if (defender.status === 'Badly Poisoned') {
        if (defender.ability === 'Poison Heal') {
          eot += Math.floor(defender.maxhp / 8);
        } else if (defender.ability !== 'Magic Guard' && defender.toxicCounter) {
          toxicCounter = defender.toxicCounter;
        }
      } else if (defender.status === 'Burned') {
        if (defender.ability === 'Heatproof') {
          eot -= Math.floor(defender.maxhp / 16);
        } else if (defender.ability !== 'Magic Guard') {
          eot -= Math.floor(defender.maxhp / 8);
        }
      } else if (defender.status === 'Asleep' && isBadDreams && defender.ability !== 'Magic Guard') {
        eot -= Math.floor(defender.maxhp / 8);
      }

      // multi-hit moves have too many possibilities for brute-forcing to work,
      // so reduce it to an approximate distribution
      if (hits > 1) {
        // this WAS squashMultihit, but let's just approximate hard
        damage = damage.map(function (dmg) {
          return dmg * hits;
        }); // eslint-disable-line
      }

      for (var i = 1; i <= 5; i++) {
        // console.log('using hits counter ' + i);
        var c = KO._getKOChance(damage, defender.hp - hazards, eot, i, defender.maxhp, toxicCounter);
        if (c > 0 && c <= 1) {
          return {
            turns: i,
            chance: Math.round(c * 1000) / 10
          };
        }
      }
      return {
        turns: null,
        chance: null
      };
    }
  }, {
    key: '_getKOChance',
    value: function _getKOChance(damage, hp, eot, hits, maxHP, toxicCounter) {
      // console.log('_getKOChance:', damage, hp, eot, hits, maxHP, toxicCounter);
      if (isNaN(hp) || hp < 0 || isNaN(hits) || hits < 0 || isNaN(maxHP) || maxHP < 0) {
        console.error('bailing out!', damage.length, hp, eot, hits, maxHP, toxicCounter);
        return 0;
      }
      // console.log('_getKOChance called.', damage.length, hp, eot, hits, maxHP, toxicCounter);
      var n = damage.length;
      var minDamage = damage[0];
      var maxDamage = damage[damage.length - 1];
      var i = void 0;
      if (hits === 1) {
        if (maxDamage < hp) {
          return 0;
        }
        for (i = 0; i < n; i++) {
          if (damage[i] >= hp) {
            return (n - i) / n;
          }
        }
      }
      if (KO._predictTotal(maxDamage, eot, hits, toxicCounter, maxHP) < hp) {
        return 0;
      } else if (KO._predictTotal(minDamage, eot, hits, toxicCounter, maxHP) >= hp) {
        return 1;
      }

      var toxicDamage = 0;
      if (toxicCounter > 0) {
        toxicDamage = Math.floor(toxicCounter * maxHP / 16);
        toxicCounter++; // eslint-disable-line
      }
      var sum = 0;
      for (i = 0; i < n; i++) {
        var c = KO._getKOChance(damage, hp - damage[i] + eot - toxicDamage, eot, hits - 1, maxHP, toxicCounter);
        if (c === 1) {
          sum += n - i;
          break;
        } else {
          sum += c;
        }
      }
      // console.log('returning ', sum / n);
      return sum / n;
    }
  }, {
    key: '_predictTotal',
    value: function _predictTotal(damage, eot, hits, toxicCounter, maxHP) {
      var toxicDamage = 0;
      if (toxicCounter > 0) {
        for (var i = 0; i < hits - 1; i++) {
          toxicDamage += Math.floor((toxicCounter + i) * maxHP / 16);
        }
      }
      return damage * hits - eot * (hits - 1) + toxicDamage;
    }
  }]);

  return KO;
}();

exports.default = KO;