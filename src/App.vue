<template>
  <div id="app">
    <div class="players">
      <div :class="{ active: currentPlayer === 'a', starter: legStarter === 'a' }" class="score left">{{ score.a }}</div>
      <div :class="{ active: currentPlayer === 'b', starter: legStarter === 'b' }" class="score">{{ score.b }}</div>
      <div class="legs left">
        <p>LEGS</p>
        <p>{{ players.a.legs }}</p>
      </div>
      <div class="legs">
        <p>LEGS</p>
        <p>{{ players.b.legs }}</p>
      </div>
    </div>
    <div class="leg-throws">
      <div ref="leftlegs">
        <div class="leg" v-for="leg in currentLeg" :key="leg">
          <div class="legnumber">Leg {{ leg }}</div>
          <div
            class="throw"
            v-for="(turn, i) in allThrows.a[leg - 1]"
            :key="i">
            {{ getThrownAmount(turn) }}
          </div>
          <div v-if="allThrows.a[leg - 1].length === 0">-</div>
        </div>
      </div>
      <div ref="rightlegs">
        <div class="leg" v-for="leg in currentLeg" :key="leg">
          <div class="legnumber">Leg {{ leg }}</div>
          <div
            class="throw"
            v-for="(turn, i) in allThrows.b[leg - 1]"
            :key="i">
            {{ getThrownAmount(turn) }}
          </div>
          <div v-if="allThrows.b[leg - 1].length === 0">-</div>
        </div>
      </div>
    </div>
    <div class="current-score">
      <div
        v-for="(score, i) in currentScores"
         :class="{ single: score.mult === 1, double: score.mult === 2, triple: score.mult === 3 }"
        :key="i"
        @click="removeCurrentScore(i)">
        {{ score.base }}
      </div>
    </div>
    <div class="specials">
      <div class="single multiplier" :class="{ active: multiplier === 1 }" @click="multiplier = 1">1x</div>
      <div class="double multiplier" :class="{ active: multiplier === 2 }" @click="multiplier = 2">2x</div>
      <div class="triple multiplier" :class="{ active: multiplier === 3 }" @click="multiplier = 3">3x</div>
      <div @click="submit({ base: 25, mult: 1, leg: currentLeg, id: throwNumber })" class="green"></div>
      <div @click="submit({ base: 50, mult: 1, leg: currentLeg, id: throwNumber })" class="red"></div>
    </div>
    <div class="numbers" :class="{ single: multiplier === 1, double: multiplier === 2, triple: multiplier === 3 }">
      <div
        @click="submit({ base: number, mult: multiplier, leg: currentLeg, id: throwNumber })"
        v-for="number in numbers"
        :key="number">
        <p>{{ number }}</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  computed: {
    otherPlayer() {
      return this.currentPlayer === 'a' ? 'b' : 'a';
    },
    overThrown() {
      return this.score[this.currentPlayer] - this.currentTotal <= 1 && !this.finished();
    },
    currentTotal() {
      return this.currentScores.reduce((acc, curr) => acc + curr.base * curr.mult, 0);
    },
    unrealizedScore() {
      return this.score[this.currentPlayer] - this.currentTotal;
    },
    lastThrownIsSpecial() {
      if(this.currentScores.length === 0) return false;
      const double = this.currentScores[this.currentScores.length - 1].mult === 2;
      const special = this.currentScores[this.currentScores.length - 1].base === 50;
      return double || special;
    },
    score() {
      return {
        a: 40 - this.getCurrentScore('a'),
        b: 40 - this.getCurrentScore('b')
      } 
    },
    currentLeg() {
      return this.players.a.legs + this.players.b.legs + 1; 
    },
    throwNumber() {
      console.log(this.allThrows);
      return this.allThrows[this.currentPlayer].length * 3 + this.currentScores.length + 1;
    },
    allThrows() {
      return {
        a: [...this.players.a.previousThrows, this.players.a.throws],
        b: [...this.players.b.previousThrows, this.players.b.throws]
      }
    }
  },
  data() {
    return {
      players: {
        a: {
          legs: 0,
          throws: [],
          previousThrows: []
        },
        b: {
          legs: 0,
          throws: [],
          previousThrows: []
        }
      },
      currentScores: [],
      entering: [],
      numbers: [],
      currentPlayer: 'a',
      legStarter: 'a',
      multiplier: 1
    }
  },
  mounted() {
    for(let i = 1; i <= 20; i++) {
      this.numbers.unshift(i);
    }
  },
  methods: {
    submit(score) {
      this.currentScores.push(score);
      if(this.finished()) return;
      if(this.currentScores.length === 3) this.addScore(score);
    },
    addScore(lastThrow) {
      if(this.overThrown) {
        lastThrow.mult = 0;
        this.players[this.currentPlayer].throws.push([lastThrow]);
        return this.turn();
      }
      this.players[this.currentPlayer].throws.push(this.currentScores);
      this.turn();
    },
    finished() {
      const isZero = this.currentTotal === this.score[this.currentPlayer];
      if(this.lastThrownIsSpecial && isZero) {
        this.players[this.currentPlayer].throws.push(this.currentScores);
        this.leg(this.currentPlayer);
        return true;
      }
      return false;
    },
    leg(winner) {
      this.players[winner].legs += 1;
      this.pushThrows('a');
      this.pushThrows('b');
      this.turn();
    },
    pushThrows(player) {
      this.players[player].previousThrows.push(this.players[player].throws);
      this.players[player].throws = [];
    },
    turn() {
      this.legStarter = this.otherPlayer;
      this.currentPlayer = this.otherPlayer;
      this.currentScores = [];
      this.$refs.leftlegs.scrollTop = this.$refs.leftlegs.scrollHeight + 80;
      this.$refs.rightlegs.scrollTop = this.$refs.rightlegs.scrollHeight + 80;
    },
    removeCurrentScore(i) {
      this.currentScores.splice(i, 1);
    },
    getCurrentScore(player) {
      return this.players[player].throws.reduce((acc, curr) => {
        return acc + curr.reduce((a, b) => a + b.base * b.mult, 0);
      }, 0);
    },
    getThrownAmount(turn) {
      return turn.reduce((acc, curr) => acc + curr.mult * curr.base, 0);
    }
  }
}
</script>

<style lang="scss" scoped>
#app {
  background-color: var(--main);
  height: 100vh;
  max-height: 100vh;
  width: 100vw;
  max-width: 100vw;
  overflow: hidden;
  color: white;
  padding: 1rem;
  .numbers {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 0.3rem;
    div {
      background-color: var(--main-darken);
      padding: 1rem 0;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
      position: relative;
    }
    &.single {
      div {
        background-color: var(--main-lighten);
      }
    }
    &.double {
      div {
        background-color: #109DB4;
      }
    }
    &.triple {
      div {
        background-color: #E926FF;
      }
    }
  }
  .specials {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 0.3rem;
    margin-bottom: 0.3rem;
    div {
      height: 3rem;
      display: flex;
      justify-content: center;
      align-items: center;
      &.green {
        background-color: green;
      }
      &.red {
        background-color: rgb(128, 0, 0);
      }
    }
    .multiplier {
      border: 2px solid transparent;
      &.single {
        border-color: var(--main-lighten);
        color: white;
        &.active {
          color: white;
          background-color: var(--main-lighten);
        }
      }
      &.double {
        border-color: #109DB4;
        color: #109DB4;
        &.active {
          color: white;
          background-color: #109DB4;
        }
      }
      &.triple {
        border-color: #e926ff;
        color: #e926ff;
        &.active {
          color: white;
          background-color: #e926ff;
        }
      }
    }
  }
  .players {
    display: grid;
    grid-template-columns: 1fr 1fr;
    border-bottom: 1px solid var(--main-lighten);
    .score {
      padding: 1rem;
      text-align: center;
      font-weight: bold;
      font-size: 30px;
      &.active {
        background-color: var(--main-lighten);
      }
      &.starter {
        position: relative;
        &::before {
          content: '';
          height: 10px;
          width: 10px;
          position: absolute;
          left: 20px;
          top: 50%;
          transform: translate(0, -50%);
          background-color: red;
          border-radius: 50%;
        }
      }
    }
    .legs {
      padding: 0.5rem 1rem;
      border-top: 1px solid var(--main-lighten);
      p:first-child {
        margin-bottom: 0.5rem;
      }
      &.left {
        text-align: right;
      }
    }
    .left {
      border-right: 1px solid var(--main-lighten);
    }
  }
  .current-score {
    padding: 0.5rem 0;
    display: flex;
    align-items: center;
    height: 45px;
    border-bottom: 1px solid var(--main-lighten);
    margin-bottom: 0.5rem;
    div {
      padding: 0.3rem 0.6rem;
      background-color: var(--main-darken);
      margin-right: 0.5rem;
      color: white;
      &.single {
        background-color: var(--main-lighten);
      }
      &.double {
        background-color: #109DB4;
      }
      &.triple {
        background-color: #E926FF;
      }
    }
  }
  .leg-throws {
    display: grid;
    grid-template-columns: 1fr 1fr;
    border-bottom: 1px solid var(--main-lighten);
    > div {
      padding: 1rem;
      max-height: 140px;
      overflow-y: auto;
      &:first-child {
        border-right: 1px solid var(--main-lighten);
      }
      .leg {
        margin-bottom: 1rem;
        .legnumber {
          font-weight: bold;
          margin-bottom: 0.5rem;
        }
      }
    }
  }
}
</style>