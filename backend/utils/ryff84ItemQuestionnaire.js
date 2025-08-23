// Ryff Scales of Psychological Well-Being - 84-Item Version
// Backend questionnaire structure for dimension filtering

const ryff84Questions = [
  // Autonomy (14 items: 1-14)
  {
    id: 1,
    text: "I am not afraid to voice my opinions, even when they are in opposition to the opinions of most people.",
    dimension: "autonomy",
    reverse: false
  },
  {
    id: 2,
    text: "My decisions are not usually influenced by what everyone else is doing.",
    dimension: "autonomy",
    reverse: false
  },
  {
    id: 3,
    text: "I tend to worry about what other people think of me.",
    dimension: "autonomy",
    reverse: true
  },
  {
    id: 4,
    text: "I tend to be influenced by people with strong opinions.",
    dimension: "autonomy",
    reverse: true
  },
  {
    id: 5,
    text: "I have confidence in my opinions, even if they are contrary to the general consensus.",
    dimension: "autonomy",
    reverse: false
  },
  {
    id: 6,
    text: "It's difficult for me to voice my own opinions on controversial matters.",
    dimension: "autonomy",
    reverse: true
  },
  {
    id: 7,
    text: "I judge myself by what I think is important, not by the values of what others think is important.",
    dimension: "autonomy",
    reverse: false
  },
  {
    id: 8,
    text: "I am concerned about how other people evaluate the choices I have made in my life.",
    dimension: "autonomy",
    reverse: true
  },
  {
    id: 9,
    text: "I am not the kind of person who gives in to social pressures to think or act in certain ways.",
    dimension: "autonomy",
    reverse: false
  },
  {
    id: 10,
    text: "I often change my mind about decisions if my friends or family disagree.",
    dimension: "autonomy",
    reverse: true
  },
  {
    id: 11,
    text: "Being happy with myself is more important to me than having others approve of me.",
    dimension: "autonomy",
    reverse: false
  },
  {
    id: 12,
    text: "I worry about how other people evaluate the choices I have made in my life.",
    dimension: "autonomy",
    reverse: true
  },
  {
    id: 13,
    text: "I have confidence in my own opinions, even if they are different from the way most other people think.",
    dimension: "autonomy",
    reverse: false
  },
  {
    id: 14,
    text: "My decisions are usually based on what I think is best for me, regardless of what others might think.",
    dimension: "autonomy",
    reverse: false
  },

  // Environmental Mastery (14 items: 15-28)
  {
    id: 15,
    text: "In general, I feel I am in charge of the situation in which I live.",
    dimension: "environmental_mastery",
    reverse: false
  },
  {
    id: 16,
    text: "The demands of everyday life often get me down.",
    dimension: "environmental_mastery",
    reverse: true
  },
  {
    id: 17,
    text: "I do not fit very well with the people and the community around me.",
    dimension: "environmental_mastery",
    reverse: true
  },
  {
    id: 18,
    text: "I am quite good at managing the many responsibilities of my daily life.",
    dimension: "environmental_mastery",
    reverse: false
  },
  {
    id: 19,
    text: "I often feel overwhelmed by my responsibilities.",
    dimension: "environmental_mastery",
    reverse: true
  },
  {
    id: 20,
    text: "I have difficulty arranging my life in a way that is satisfying to me.",
    dimension: "environmental_mastery",
    reverse: true
  },
  {
    id: 21,
    text: "I have been able to build a home and a lifestyle for myself that is much to my liking.",
    dimension: "environmental_mastery",
    reverse: false
  },
  {
    id: 22,
    text: "I find it stressful that I can't keep up with all of the things I have to do each day.",
    dimension: "environmental_mastery",
    reverse: true
  },
  {
    id: 23,
    text: "I am good at juggling my time so that I can fit everything in that needs to get done.",
    dimension: "environmental_mastery",
    reverse: false
  },
  {
    id: 24,
    text: "My daily life is busy, but I derive a sense of satisfaction from keeping up with everything.",
    dimension: "environmental_mastery",
    reverse: false
  },
  {
    id: 25,
    text: "I get frustrated when trying to plan my daily activities because I never accomplish the things I set out to do.",
    dimension: "environmental_mastery",
    reverse: true
  },
  {
    id: 26,
    text: "My efforts to find the kinds of activities and relationships that I need have been quite successful.",
    dimension: "environmental_mastery",
    reverse: false
  },
  {
    id: 27,
    text: "I have been able to create a lifestyle for myself that reflects my values and beliefs.",
    dimension: "environmental_mastery",
    reverse: false
  },
  {
    id: 28,
    text: "The demands of everyday life often get me down.",
    dimension: "environmental_mastery",
    reverse: true
  },

  // Personal Growth (14 items: 29-42)
  {
    id: 29,
    text: "I am not interested in activities that will expand my horizons.",
    dimension: "personal_growth",
    reverse: true
  },
  {
    id: 30,
    text: "I think it is important to have new experiences that challenge how you think about yourself and the world.",
    dimension: "personal_growth",
    reverse: false
  },
  {
    id: 31,
    text: "When I think about it, I haven't really improved much as a person over the years.",
    dimension: "personal_growth",
    reverse: true
  },
  {
    id: 32,
    text: "I have a sense that I have developed a lot as a person over time.",
    dimension: "personal_growth",
    reverse: false
  },
  {
    id: 33,
    text: "I do not enjoy being in new situations that require me to change my old familiar ways of doing things.",
    dimension: "personal_growth",
    reverse: true
  },
  {
    id: 34,
    text: "For me, life has been a continuous process of learning, changing, and growth.",
    dimension: "personal_growth",
    reverse: false
  },
  {
    id: 35,
    text: "I gave up trying to make big improvements or changes in my life a long time ago.",
    dimension: "personal_growth",
    reverse: true
  },
  {
    id: 36,
    text: "There is truth to the saying that you can't teach an old dog new tricks.",
    dimension: "personal_growth",
    reverse: true
  },
  {
    id: 37,
    text: "I have the sense that I have developed a lot as a person over time.",
    dimension: "personal_growth",
    reverse: false
  },
  {
    id: 38,
    text: "I do not enjoy being in new situations that require me to change my old familiar ways of doing things.",
    dimension: "personal_growth",
    reverse: true
  },
  {
    id: 39,
    text: "Looking at my life, I am pleased with how things have turned out so far.",
    dimension: "personal_growth",
    reverse: false
  },
  {
    id: 40,
    text: "Life is a continuous process of change, growth, and development.",
    dimension: "personal_growth",
    reverse: false
  },
  {
    id: 41,
    text: "I enjoy seeing how my views have changed and matured over the years.",
    dimension: "personal_growth",
    reverse: false
  },
  {
    id: 42,
    text: "I think it is important to have new experiences that challenge how you think about yourself and the world.",
    dimension: "personal_growth",
    reverse: false
  },

  // Positive Relations with Others (14 items: 43-56)
  {
    id: 43,
    text: "Most people see me as loving and affectionate.",
    dimension: "positive_relations",
    reverse: false
  },
  {
    id: 44,
    text: "Maintaining close relationships has been difficult and frustrating for me.",
    dimension: "positive_relations",
    reverse: true
  },
  {
    id: 45,
    text: "I often feel lonely because I have few close friends with whom to share my concerns.",
    dimension: "positive_relations",
    reverse: true
  },
  {
    id: 46,
    text: "I enjoy personal and mutual conversations with family members or friends.",
    dimension: "positive_relations",
    reverse: false
  },
  {
    id: 47,
    text: "People would describe me as a giving person, willing to share my time with others.",
    dimension: "positive_relations",
    reverse: false
  },
  {
    id: 48,
    text: "I have not experienced many warm and trusting relationships with others.",
    dimension: "positive_relations",
    reverse: true
  },
  {
    id: 49,
    text: "I know that I can trust my friends, and they know they can trust me.",
    dimension: "positive_relations",
    reverse: false
  },
  {
    id: 50,
    text: "I find it difficult to really open up when I talk with others.",
    dimension: "positive_relations",
    reverse: true
  },
  {
    id: 51,
    text: "My friends and I sympathize with each other's problems.",
    dimension: "positive_relations",
    reverse: false
  },
  {
    id: 52,
    text: "Most people see me as loving and affectionate.",
    dimension: "positive_relations",
    reverse: false
  },
  {
    id: 53,
    text: "It seems to me that most other people have more friends than I do.",
    dimension: "positive_relations",
    reverse: true
  },
  {
    id: 54,
    text: "People would describe me as a giving person, willing to share my time with others.",
    dimension: "positive_relations",
    reverse: false
  },
  {
    id: 55,
    text: "I have friends who are there for me when I need them.",
    dimension: "positive_relations",
    reverse: false
  },
  {
    id: 56,
    text: "Maintaining close relationships has been difficult and frustrating for me.",
    dimension: "positive_relations",
    reverse: true
  },

  // Purpose in Life (14 items: 57-70)
  {
    id: 57,
    text: "I live life one day at a time and don't really think about the future.",
    dimension: "purpose_in_life",
    reverse: true
  },
  {
    id: 58,
    text: "I have a sense of direction and purpose in life.",
    dimension: "purpose_in_life",
    reverse: false
  },
  {
    id: 59,
    text: "My daily activities often seem trivial and unimportant to me.",
    dimension: "purpose_in_life",
    reverse: true
  },
  {
    id: 60,
    text: "I don't have a good sense of what it is I'm trying to accomplish in life.",
    dimension: "purpose_in_life",
    reverse: true
  },
  {
    id: 61,
    text: "I enjoy making plans for the future and working to make them a reality.",
    dimension: "purpose_in_life",
    reverse: false
  },
  {
    id: 62,
    text: "Some people wander aimlessly through life, but I am not one of them.",
    dimension: "purpose_in_life",
    reverse: false
  },
  {
    id: 63,
    text: "I sometimes feel as if I've done all there is to do in life.",
    dimension: "purpose_in_life",
    reverse: true
  },
  {
    id: 64,
    text: "My aims in life have been more a source of satisfaction than frustration to me.",
    dimension: "purpose_in_life",
    reverse: false
  },
  {
    id: 65,
    text: "I find it satisfying to think about what I have accomplished in life.",
    dimension: "purpose_in_life",
    reverse: false
  },
  {
    id: 66,
    text: "My daily activities often seem trivial and unimportant to me.",
    dimension: "purpose_in_life",
    reverse: true
  },
  {
    id: 67,
    text: "I have goals in life and a sense of directedness.",
    dimension: "purpose_in_life",
    reverse: false
  },
  {
    id: 68,
    text: "I used to set goals for myself, but that now seems like a waste of time.",
    dimension: "purpose_in_life",
    reverse: true
  },
  {
    id: 69,
    text: "I enjoy making plans for the future and working to make them a reality.",
    dimension: "purpose_in_life",
    reverse: false
  },
  {
    id: 70,
    text: "Some people wander aimlessly through life, but I am not one of them.",
    dimension: "purpose_in_life",
    reverse: false
  },

  // Self-Acceptance (14 items: 71-84)
  {
    id: 71,
    text: "When I look at the story of my life, I am pleased with how things have turned out.",
    dimension: "self_acceptance",
    reverse: false
  },
  {
    id: 72,
    text: "In general, I feel confident and positive about myself.",
    dimension: "self_acceptance",
    reverse: false
  },
  {
    id: 73,
    text: "I feel like many of the people I know have gotten more out of life than I have.",
    dimension: "self_acceptance",
    reverse: true
  },
  {
    id: 74,
    text: "I like most aspects of my personality.",
    dimension: "self_acceptance",
    reverse: false
  },
  {
    id: 75,
    text: "In many ways, I feel disappointed about my achievements in life.",
    dimension: "self_acceptance",
    reverse: true
  },
  {
    id: 76,
    text: "My attitude about myself is probably not as positive as most people feel about themselves.",
    dimension: "self_acceptance",
    reverse: true
  },
  {
    id: 77,
    text: "When I compare myself to friends and acquaintances, it makes me feel good about who I am.",
    dimension: "self_acceptance",
    reverse: false
  },
  {
    id: 78,
    text: "I made some mistakes in the past, but I feel that all in all everything has worked out for the best.",
    dimension: "self_acceptance",
    reverse: false
  },
  {
    id: 79,
    text: "I feel like many of the people I know have gotten more out of life than I have.",
    dimension: "self_acceptance",
    reverse: true
  },
  {
    id: 80,
    text: "I like most parts of my personality.",
    dimension: "self_acceptance",
    reverse: false
  },
  {
    id: 81,
    text: "When I look at the story of my life, I am pleased with how things have turned out.",
    dimension: "self_acceptance",
    reverse: false
  },
  {
    id: 82,
    text: "Given the opportunity, there are many things about myself that I would change.",
    dimension: "self_acceptance",
    reverse: true
  },
  {
    id: 83,
    text: "In general, I feel confident and positive about myself.",
    dimension: "self_acceptance",
    reverse: false
  },
  {
    id: 84,
    text: "I have been able to build the kind of life I wanted.",
    dimension: "self_acceptance",
    reverse: false
  }
];

module.exports = ryff84Questions;