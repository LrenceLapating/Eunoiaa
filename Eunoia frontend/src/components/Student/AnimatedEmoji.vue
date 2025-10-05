<template>
  <div class="emoji-container">
    <div 
      v-for="emoji in activeEmojis" 
      :key="emoji.id"
      class="floating-emoji"
      :style="emoji.style"
      @animationend="removeEmoji(emoji.id)"
    >
      {{ emoji.symbol }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'AnimatedEmoji',
  data() {
    return {
      activeEmojis: [],
      emojiId: 0,
      // Different emoji sets for different choice values
      emojiSets: {
        1: ['😔', '😞', '😟', '😢', '😕', '😰', '😨'], // Strongly Disagree
        2: ['😐', '😑', '🤔', '😶', '😒', '😤', '😮‍💨'], // Disagree  
        3: ['🤷‍♀️', '🤷‍♂️', '😐', '😶', '🤨', '😯', '🫤'], // Slightly Disagree
        4: ['🙂', '😊', '😌', '😇', '🤗', '😋', '😎'], // Slightly Agree
        5: ['😄', '😃', '😁', '🥰', '😍', '🤩', '😘'], // Agree
        6: ['🎉', '🥳', '🤗', '😍', '🌟', '✨', '💫', '🎊', '🎈', '🚀'] // Strongly Agree
      }
    }
  },
  methods: {
    triggerEmoji(choiceValue, clickX, clickY) {
      const emojiSet = this.emojiSets[choiceValue] || this.emojiSets[4]
      const randomEmoji = emojiSet[Math.floor(Math.random() * emojiSet.length)]
      
      // Show only 1 emoji for cleaner animation
      const emoji = {
        id: this.emojiId++,
        symbol: randomEmoji,
        style: this.generateEmojiStyle(clickX, clickY)
      }
      
      this.activeEmojis.push(emoji)
      
      // Auto-remove after animation duration
      setTimeout(() => {
        this.removeEmoji(emoji.id)
      }, 2000)
    },
    
    generateEmojiStyle(clickX, clickY) {
      // Create a subtle upward movement from click position
      const rotation = (Math.random() - 0.5) * 30 // -15deg to +15deg for subtle rotation
      const scale = 1 + Math.random() * 0.2 // 1.0 to 1.2 scale
      
      return {
        left: `${clickX}px`,
        top: `${clickY}px`,
        transform: `rotate(${rotation}deg) scale(${scale})`,
        fontSize: `28px` // Consistent size
      }
    },
    
    removeEmoji(emojiId) {
      const index = this.activeEmojis.findIndex(emoji => emoji.id === emojiId)
      if (index > -1) {
        this.activeEmojis.splice(index, 1)
      }
    }
  }
}
</script>

<style scoped>
.emoji-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 9999;
  overflow: hidden;
}

.floating-emoji {
  position: absolute;
  font-size: 28px;
  pointer-events: none;
  animation: smoothFloatAndFade 2s ease-out forwards;
  transform-origin: center;
}

@keyframes smoothFloatAndFade {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  25% {
    opacity: 1;
    transform: translateY(-30px) scale(1.1);
  }
  50% {
    opacity: 0.8;
    transform: translateY(-80px) scale(1.05);
  }
  75% {
    opacity: 0.4;
    transform: translateY(-120px) scale(0.95);
  }
  100% {
    opacity: 0;
    transform: translateY(-160px) scale(0.8);
  }
}

/* Bounce effect for strongly positive responses */
.floating-emoji.bounce {
  animation: bounceAndFade 2.5s ease-out forwards;
}

@keyframes bounceAndFade {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  15% {
    opacity: 1;
    transform: translateY(-40px) scale(1.3);
  }
  30% {
    opacity: 1;
    transform: translateY(-10px) scale(1.1);
  }
  45% {
    opacity: 0.9;
    transform: translateY(-60px) scale(1.2);
  }
  60% {
    opacity: 0.7;
    transform: translateY(-100px) scale(1.0);
  }
  80% {
    opacity: 0.4;
    transform: translateY(-150px) scale(0.8);
  }
  100% {
    opacity: 0;
    transform: translateY(-220px) scale(0.5);
  }
}
</style>