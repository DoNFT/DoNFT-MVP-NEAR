<template>
  <div class="effect-cards">
    <div v-for="card in cards" class="effect-cards__item" :key="card.id" :class="cardClass(card.token_id)">
      <div @click="cardClicked(card)" class="effect-cards__item__inner">
        <token-card
          :metadata="card"
        />
        <div class="effect-cards__item__footer">
          <p :class="{'card-title': cardSize === 'standard', 'card-text': cardSize === 'smaller'}">
            <span v-if="showId && card.id">{{ shorten(card.id, 5) }}: </span>{{ shorten(card.name, 30) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {shorten, placeholder} from "@/utilities"
import TokenCard from '@/components/TokenCard/TokenCard'

export default {
  name: "EffectCards",
  props: {
    cards: Array,
    choice: Array,
    cardSize: String,
    showId: Boolean,
    contentType: String,
  },
  components: {
    TokenCard,
  },
  methods: {
    cardClicked(card) {
      console.log(card, 'CARD')
      this.$emit('card-clicked', card)
    },
    cardClass(idx) {
      return {
        'chosen-card': this.choice.indexOf(idx) !== -1,
        'choosable-card': this.choice.indexOf(idx) === -1,
        'standard-card-size': this.cardSize === 'standard',
        'smaller-card-size': this.cardSize === 'smaller'
      }
    },
    placeholder,
    shorten
  }
}
</script>

<style lang="scss" scoped>
.standard-card-size {
    height: 242px;
    width: 168px;
}

.smaller-card-size {
    height: 200px;
    width: 137px;
}

.rounded-16 {
    border-radius: 16px !important;
}

.card-body {
  max-height: 56px;
}

.effect-cards {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}

.effect-cards__item {
  width: 24%;
  min-width: 230px;
  margin-bottom: 20px;
  background: linear-gradient(0deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05)), #121212;
  box-shadow: 0px 1px 1px rgba(0, 0, 0, 0.14), 0px 2px 1px rgba(0, 0, 0, 0.12), 0px 1px 3px rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  color: #dedede;
  cursor: pointer;
  transition: transform .1s ease-in-out, box-shadow .1s ease;
}

.chosen-card {
    box-shadow: 0px 0px 7px 6px rgba(192, 127, 255, 0.7);
    transform: scale(0.92);
}

.card-img {
  width: 100%;
  min-height: 200px;
  object-fit: cover;
}

.effect-cards__item__inner {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.effect-cards__item__footer {
  text-align: center;
  
  p {
    margin: 5px 0;
  }
}
</style>