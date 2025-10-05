// Ryff Scales of Psychological Well-Being - 84-Item Version
// Backend questionnaire structure for dimension filtering

const ryff84Questions = [
  // Item 1 - Autonomy
  {
    id: 1,
    text: "Sometimes I change the way I act or think to be more like those around me.",
    dimension: "autonomy",
    reverse: true
  },
  // Item 2 - Environmental Mastery
  {
    id: 2,
    text: "I am not afraid to voice my opinions, even when they are in opposition to the opinions of most people.",
    dimension: "environmental_mastery",
    reverse: false
  },
  // Item 3 - Personal Growth
  {
    id: 3,
    text: "My decisions are not usually influenced by what everyone else is doing.",
    dimension: "personal_growth",
    reverse: true
  },
  // Item 4 - Positive Relations
  {
    id: 4,
    text: "I tend to worry about what other people think of me.",
    dimension: "positive_relations",
    reverse: false
  },
  // Item 5 - Purpose in Life
  {
    id: 5,
    text: "Being happy with myself is more important to me than having others approve of me.",
    dimension: "purpose_in_life",
    reverse: false
  },
  // Item 6 - Self-Acceptance
  {
    id: 6,
    text: "I tend to be influenced by people with strong opinions.",
    dimension: "self_acceptance",
    reverse: false
  },
  // Item 7 - Autonomy
  {
    id: 7,
    text: "People rarely talk me into doing things I don't want to do.",
    dimension: "autonomy",
    reverse: false
  },
  // Item 8 - Environmental Mastery
  {
    id: 8,
    text: "It is more important to me to \"fit in\" with others than to stand alone on my principles.",
    dimension: "environmental_mastery",
    reverse: true
  },
  // Item 9 - Personal Growth
  {
    id: 9,
    text: "I have confidence in my opinions, even if they are contrary to the general consensus.",
    dimension: "personal_growth",
    reverse: false
  },
  // Item 10 - Positive Relations
  {
    id: 10,
    text: "I am not the kind of person who gives in to social pressures to think or act in certain ways.",
    dimension: "positive_relations",
    reverse: true
  },
  // Item 11 - Purpose in Life
  {
    id: 11,
    text: "I am concerned about how other people evaluate the choices I have made in my life.",
    dimension: "purpose_in_life",
    reverse: true
  },
  // Item 12 - Self-Acceptance
  {
    id: 12,
    text: "I judge myself by what I think is important, not by the values of what others think is important.",
    dimension: "self_acceptance",
    reverse: false
  },
  // Item 13 - Autonomy
  {
    id: 13,
    text: "It's difficult for me to voice my own opinions on controversial matters.",
    dimension: "autonomy",
    reverse: false
  },
  // Item 14 - Environmental Mastery
  {
    id: 14,
    text: "I often change my mind about decisions if my friends or family disagree.",
    dimension: "environmental_mastery",
    reverse: true
  },

  // Item 15 - Personal Growth
  {
    id: 15,
    text: "In general, I feel I am in charge of the situation in which I live.",
    dimension: "personal_growth",
    reverse: false
  },
  // Item 16 - Positive Relations
  {
    id: 16,
    text: "The demands of everyday life often get me down.",
    dimension: "positive_relations",
    reverse: true
  },
  // Item 17 - Purpose in Life
  {
    id: 17,
    text: "I do not fit very well with the people and the community around me.",
    dimension: "purpose_in_life",
    reverse: true
  },
  // Item 18 - Self-Acceptance
  {
    id: 18,
    text: "I am quite good at managing the many responsibilities of my daily life.",
    dimension: "self_acceptance",
    reverse: true
  },
  // Item 19 - Autonomy
  {
    id: 19,
    text: "I often feel overwhelmed by my responsibilities.",
    dimension: "autonomy",
    reverse: true
  },
  // Item 20 - Environmental Mastery
  {
    id: 20,
    text: "If I were unhappy with my living situation, I would take effective steps to change it.",
    dimension: "environmental_mastery",
    reverse: false
  },
  // Item 21 - Personal Growth
  {
    id: 21,
    text: "I generally do a good job of taking care of my personal finances and affairs.",
    dimension: "personal_growth",
    reverse: true
  },
  // Item 22 - Positive Relations
  {
    id: 22,
    text: "I find it stressful that I can't keep up with all of the things I have to do each day.",
    dimension: "positive_relations",
    reverse: false
  },
  // Item 23 - Purpose in Life
  {
    id: 23,
    text: "I am good at juggling my time so that I can fit everything in that needs to be done.",
    dimension: "purpose_in_life",
    reverse: false
  },
  // Item 24 - Self-Acceptance
  {
    id: 24,
    text: "My daily life is busy, but I derive a sense of satisfaction from keeping up with everything.",
    dimension: "self_acceptance",
    reverse: true
  },
  // Item 25 - Autonomy
  {
    id: 25,
    text: "I get frustrated when trying to plan my daily activities because I never accomplish the things I set out to do.",
    dimension: "autonomy",
    reverse: false
  },
  // Item 26 - Environmental Mastery
  {
    id: 26,
    text: "My efforts to find the kinds of activities and relationships that I need have been quite successful.",
    dimension: "environmental_mastery",
    reverse: true
  },
  // Item 27 - Personal Growth
  {
    id: 27,
    text: "I have difficulty arranging my life in a way that is satisfying to me.",
    dimension: "personal_growth",
    reverse: false
  },
  // Item 28 - Positive Relations
  {
    id: 28,
    text: "I have been able to build a home and a lifestyle for myself that is much to my liking.",
    dimension: "positive_relations",
    reverse: false
  },

  // Item 29 - Purpose in Life
  {
    id: 29,
    text: "I am not interested in activities that will expand my horizons.",
    dimension: "purpose_in_life",
    reverse: true
  },
  // Item 30 - Self-Acceptance
  {
    id: 30,
    text: "In general, I feel that I continue to learn more about myself as time goes by.",
    dimension: "self_acceptance",
    reverse: false
  },
  // Item 31 - Autonomy
  {
    id: 31,
    text: "I am the kind of person who likes to give new things a try.",
    dimension: "autonomy",
    reverse: true
  },
  // Item 32 - Environmental Mastery
  {
    id: 32,
    text: "I don't want to try new ways of doing things—my life is fine the way it is.",
    dimension: "environmental_mastery",
    reverse: false
  },
  // Item 33 - Personal Growth
  {
    id: 33,
    text: "I think it is important to have new experiences that challenge how you think about yourself and the world.",
    dimension: "personal_growth",
    reverse: true
  },
  // Item 34 - Positive Relations
  {
    id: 34,
    text: "When I think about it, I haven't really improved much as a person over the years.",
    dimension: "positive_relations",
    reverse: true
  },
  // Item 35 - Purpose in Life
  {
    id: 35,
    text: "In my view, people of every age are able to continue growing and developing.",
    dimension: "purpose_in_life",
    reverse: true
  },
  // Item 36 - Self-Acceptance
  {
    id: 36,
    text: "With time, I have gained a lot of insight about life that has made me a stronger, more capable person.",
    dimension: "self_acceptance",
    reverse: false
  },
  // Item 37 - Autonomy
  {
    id: 37,
    text: "I have the sense that I have developed a lot as a person over time.",
    dimension: "autonomy",
    reverse: false
  },
  // Item 38 - Environmental Mastery
  {
    id: 38,
    text: "I do not enjoy being in new situations that require me to change my old familiar ways of doing things.",
    dimension: "environmental_mastery",
    reverse: false
  },
  // Item 39 - Personal Growth
  {
    id: 39,
    text: "For me, life has been a continuous process of learning, changing, and growth.",
    dimension: "personal_growth",
    reverse: false
  },
  // Item 40 - Positive Relations
  {
    id: 40,
    text: "I enjoy seeing how my views have changed and matured over the years.",
    dimension: "positive_relations",
    reverse: false
  },
  // Item 41 - Purpose in Life
  {
    id: 41,
    text: "I gave up trying to make big improvements or changes in my life a long time ago.",
    dimension: "purpose_in_life",
    reverse: true
  },
  // Item 42 - Self-Acceptance
  {
    id: 42,
    text: "There is truth to the saying you can't teach an old dog new tricks.",
    dimension: "self_acceptance",
    reverse: true
  },

  // Item 43 - Autonomy
  {
    id: 43,
    text: "Most people see me as loving and affectionate.",
    dimension: "autonomy",
    reverse: true
  },
  // Item 44 - Environmental Mastery
  {
    id: 44,
    text: "Maintaining close relationships has been difficult and frustrating for me.",
    dimension: "environmental_mastery",
    reverse: true
  },
  // Item 45 - Personal Growth
  {
    id: 45,
    text: "I often feel lonely because I have few close friends with whom to share my concerns.",
    dimension: "personal_growth",
    reverse: false
  },
  // Item 46 - Positive Relations
  {
    id: 46,
    text: "I enjoy personal and mutual conversations with family members or friends.",
    dimension: "positive_relations",
    reverse: true
  },
  // Item 47 - Purpose in Life
  {
    id: 47,
    text: "It is important to me to be a good listener when close friends talk to me about their problems.",
    dimension: "purpose_in_life",
    reverse: false
  },
  // Item 48 - Self-Acceptance
  {
    id: 48,
    text: "I don't have many people who want to listen when I need to talk.",
    dimension: "self_acceptance",
    reverse: false
  },
  // Item 49 - Autonomy
  {
    id: 49,
    text: "I feel like I get a lot out of my friendships.",
    dimension: "autonomy",
    reverse: false
  },
  // Item 50 - Environmental Mastery
  {
    id: 50,
    text: "It seems to me that most other people have more friends than I do.",
    dimension: "environmental_mastery",
    reverse: false
  },
  // Item 51 - Personal Growth
  {
    id: 51,
    text: "People would describe me as a giving person, willing to share my time with others.",
    dimension: "personal_growth",
    reverse: false
  },
  // Item 52 - Positive Relations
  {
    id: 52,
    text: "I have not experienced many warm and trusting relationships with others.",
    dimension: "positive_relations",
    reverse: false
  },
  // Item 53 - Purpose in Life
  {
    id: 53,
    text: "I know that I can trust my friends, and they know they can trust me.",
    dimension: "purpose_in_life",
    reverse: false
  },
  // Item 54 - Self-Acceptance
  {
    id: 54,
    text: "I often feel like I'm on the outside looking in when it comes to friendships.",
    dimension: "self_acceptance",
    reverse: true
  },
  // Item 55 - Autonomy
  {
    id: 55,
    text: "I find it difficult to really open up when I talk with others.",
    dimension: "autonomy",
    reverse: true
  },
  // Item 56 - Environmental Mastery
  {
    id: 56,
    text: "My friends and I sympathize with each other's problems.",
    dimension: "environmental_mastery",
    reverse: false
  },

  // Item 57 - Personal Growth
  {
    id: 57,
    text: "I feel good when I think of what I've done in the past and what I hope to do in the future.",
    dimension: "personal_growth",
    reverse: true
  },
  // Item 58 - Positive Relations
  {
    id: 58,
    text: "I live life one day at a time and don't really think about the future.",
    dimension: "positive_relations",
    reverse: true
  },
  // Item 59 - Purpose in Life
  {
    id: 59,
    text: "I tend to focus on the present, because the future nearly always brings me problems.",
    dimension: "purpose_in_life",
    reverse: false
  },
  // Item 60 - Self-Acceptance
  {
    id: 60,
    text: "I have a sense of direction and purpose in life.",
    dimension: "self_acceptance",
    reverse: true
  },
  // Item 61 - Autonomy
  {
    id: 61,
    text: "My daily activities often seem trivial and unimportant to me.",
    dimension: "autonomy",
    reverse: true
  },
  // Item 62 - Environmental Mastery
  {
    id: 62,
    text: "I don't have a good sense of what it is I'm trying to accomplish in life.",
    dimension: "environmental_mastery",
    reverse: true
  },
  // Item 63 - Personal Growth
  {
    id: 63,
    text: "I used to set goals for myself, but that now seems like a waste of time.",
    dimension: "personal_growth",
    reverse: false
  },
  // Item 64 - Positive Relations
  {
    id: 64,
    text: "I enjoy making plans for the future and working to make them a reality.",
    dimension: "positive_relations",
    reverse: true
  },
  // Item 65 - Purpose in Life
  {
    id: 65,
    text: "I am an active person in carrying out the plans I set for myself.",
    dimension: "purpose_in_life",
    reverse: true
  },
  // Item 66 - Self-Acceptance
  {
    id: 66,
    text: "Some people wander aimlessly through life, but I am not one of them.",
    dimension: "self_acceptance",
    reverse: true
  },
  // Item 67 - Autonomy
  {
    id: 67,
    text: "I sometimes feel as if I've done all there is to do in life.",
    dimension: "autonomy",
    reverse: false
  },
  // Item 68 - Environmental Mastery
  {
    id: 68,
    text: "My aims in life have been more a source of satisfaction than frustration to me.",
    dimension: "environmental_mastery",
    reverse: false
  },
  // Item 69 - Personal Growth
  {
    id: 69,
    text: "I find it satisfying to think about what I have accomplished in life.",
    dimension: "personal_growth",
    reverse: false
  },
  // Item 70 - Positive Relations
  {
    id: 70,
    text: "In the final analysis, I'm not so sure that my life adds up to much.",
    dimension: "positive_relations",
    reverse: false
  },

  // Item 71 - Purpose in Life
  {
    id: 71,
    text: "When I look at the story of my life, I am pleased with how things have turned out.",
    dimension: "purpose_in_life",
    reverse: false
  },
  // Item 72 - Self-Acceptance
  {
    id: 72,
    text: "I feel like many of the people I know have gotten more out of life than I have.",
    dimension: "self_acceptance",
    reverse: false
  },
  // Item 73 - Autonomy
  {
    id: 73,
    text: "In general, I feel confident and positive about myself.",
    dimension: "autonomy",
    reverse: true
  },
  // Item 74 - Environmental Mastery
  {
    id: 74,
    text: "Given the opportunity, there are many things about myself that I would change.",
    dimension: "environmental_mastery",
    reverse: true
  },
  // Item 75 - Personal Growth
  {
    id: 75,
    text: "I like most aspects of my personality.",
    dimension: "personal_growth",
    reverse: true
  },
  // Item 76 - Positive Relations
  {
    id: 76,
    text: "I made some mistakes in the past, but I feel that all in all everything has worked out for the best.",
    dimension: "positive_relations",
    reverse: true
  },
  // Item 77 - Purpose in Life
  {
    id: 77,
    text: "In many ways, I feel disappointed about my achievements in life.",
    dimension: "purpose_in_life",
    reverse: false
  },
  // Item 78 - Self-Acceptance
  {
    id: 78,
    text: "For the most part, I am proud of who I am and the life I lead.",
    dimension: "self_acceptance",
    reverse: false
  },
  // Item 79 - Autonomy
  {
    id: 79,
    text: "I envy many people for the lives they lead.",
    dimension: "autonomy",
    reverse: false
  },
  // Item 80 - Environmental Mastery
  {
    id: 80,
    text: "My attitude about myself is probably not as positive as most people feel about themselves.",
    dimension: "environmental_mastery",
    reverse: false
  },
  // Item 81 - Personal Growth
  {
    id: 81,
    text: "Many days I wake up feeling discouraged about how I have lived my life.",
    dimension: "personal_growth",
    reverse: true
  },
  // Item 82 - Positive Relations
  {
    id: 82,
    text: "The past had its ups and downs, but in general, I wouldn't want to change it.",
    dimension: "positive_relations",
    reverse: false
  },
  // Item 83 - Purpose in Life
  {
    id: 83,
    text: "When I compare myself to friends and acquaintances, it makes me feel good about who I am.",
    dimension: "purpose_in_life",
    reverse: true
  },
  // Item 84 - Self-Acceptance
  {
    id: 84,
    text: "Everyone has their weaknesses, but I seem to have more than my share.",
    dimension: "self_acceptance",
    reverse: true
  }
];

module.exports = ryff84Questions;