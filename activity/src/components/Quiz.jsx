import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import ProgressRing from './ProgressRing';
import './Quiz.css';

const Quiz = ({ user, onBack }) => {
  const [quiz, setQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuiz();
  }, []);

  const fetchQuiz = async () => {
    try {
      const response = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: 'JavaScript',
          numQuestions: 5,
          userId: user?.id
        })
      });
      const data = await response.json();
      setQuiz(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch quiz:', error);
      setLoading(false);
    }
  };

  const handleAnswerClick = (index) => {
    if (showFeedback) return;

    setSelectedAnswer(index);
    const correct = index === quiz.questions[currentQuestion].correctIndex;
    setIsCorrect(correct);
    setShowFeedback(true);

    if (correct) {
      setScore(score + (quiz.questions[currentQuestion].xp || 10));
      setStreak(streak + 1);
      
      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#8b5cf6', '#ec4899', '#f59e0b']
      });
    } else {
      setStreak(0);
    }
  };

  const handleNext = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    } else {
      // Quiz complete - mega confetti
      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#8b5cf6', '#ec4899', '#f59e0b', '#22c55e']
      });
    }
  };

  if (loading) {
    return (
      <div className="quiz-container">
        <div className="spinner"></div>
        <p>Generating your quiz...</p>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="quiz-container">
        <p>Failed to load quiz. Please try again.</p>
        <button className="premium-button" onClick={onBack}>Back</button>
      </div>
    );
  }

  const question = quiz.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;
  const isComplete = currentQuestion === quiz.questions.length - 1 && showFeedback;

  return (
    <div className="quiz-container">
      <button className="back-button" onClick={onBack}>← Back</button>

      <div className="quiz-content">
        {!isComplete ? (
          <>
            {/* Header Stats */}
            <div className="quiz-header animate-slide-down">
              <div className="stat-card glass-card">
                <div className="stat-icon">⭐</div>
                <div className="stat-value">{score}</div>
                <div className="stat-label">XP</div>
              </div>
              <div className="stat-card glass-card">
                <div className="stat-icon">🔥</div>
                <div className="stat-value">{streak}</div>
                <div className="stat-label">Streak</div>
              </div>
              <div className="stat-card glass-card">
                <div className="stat-icon">📊</div>
                <div className="stat-value">{currentQuestion + 1}/{quiz.questions.length}</div>
                <div className="stat-label">Progress</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="progress-bar-container animate-slide-down" style={{ animationDelay: '0.1s' }}>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }}></div>
              </div>
              <div className="progress-dots">
                {quiz.questions.map((_, index) => (
                  <div 
                    key={index}
                    className={`progress-dot ${index < currentQuestion ? 'completed' : ''} ${index === currentQuestion ? 'current' : ''}`}
                  />
                ))}
              </div>
            </div>

            {/* Question Card */}
            <div className={`question-card glass-card animate-scale-in ${showFeedback ? (isCorrect ? 'bounce' : 'shake') : ''}`}>
              <div className="question-number">Question {currentQuestion + 1}</div>
              <h2 className="question-text">{question.question}</h2>
              
              <div className="answers-grid">
                {question.options.map((option, index) => (
                  <button
                    key={index}
                    className={`answer-option glass-card ${
                      selectedAnswer === index 
                        ? isCorrect 
                          ? 'correct' 
                          : 'incorrect'
                        : ''
                    } ${
                      showFeedback && index === question.correctIndex
                        ? 'show-correct'
                        : ''
                    }`}
                    onClick={() => handleAnswerClick(index)}
                    disabled={showFeedback}
                  >
                    <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                    <span className="option-text">{option}</span>
                    {showFeedback && index === question.correctIndex && (
                      <span className="check-icon">✓</span>
                    )}
                    {showFeedback && selectedAnswer === index && !isCorrect && (
                      <span className="cross-icon">✗</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Feedback Card */}
            {showFeedback && (
              <div className={`feedback-card glass-card animate-slide-up ${isCorrect ? 'feedback-correct' : 'feedback-incorrect'}`}>
                <div className="feedback-header">
                  <div className="feedback-icon">{isCorrect ? '✅' : '❌'}</div>
                  <h3>{isCorrect ? 'Correct!' : 'Incorrect'}</h3>
                </div>
                <p className="feedback-text">{question.explanation}</p>
                {isCorrect && (
                  <div className="xp-gained">
                    <span className="xp-icon">⭐</span>
                    <span className="xp-text">+{question.xp || 10} XP</span>
                    {streak > 1 && (
                      <span className="streak-bonus">🔥 {streak} Streak!</span>
                    )}
                  </div>
                )}
                <button className="premium-button" onClick={handleNext}>
                  {currentQuestion < quiz.questions.length - 1 ? 'Next Question →' : 'View Results →'}
                </button>
              </div>
            )}
          </>
        ) : (
          /* Results Screen */
          <div className="results-screen animate-scale-in">
            <div className="results-header">
              <ProgressRing 
                progress={(score / (quiz.questions.length * 10)) * 100} 
                size={200}
              />
              <h1 className="results-title">Quiz Complete! 🎉</h1>
              <p className="results-subtitle">
                You scored <span className="text-gradient-gold">{score} XP</span>
              </p>
            </div>

            <div className="results-stats">
              <div className="result-stat glass-card">
                <div className="stat-icon">📊</div>
                <div className="stat-value">{Math.round((score / (quiz.questions.length * 10)) * 100)}%</div>
                <div className="stat-label">Accuracy</div>
              </div>
              <div className="result-stat glass-card">
                <div className="stat-icon">⭐</div>
                <div className="stat-value">{score}</div>
                <div className="stat-label">Total XP</div>
              </div>
              <div className="result-stat glass-card">
                <div className="stat-icon">✅</div>
                <div className="stat-value">{quiz.questions.filter((q, i) => i <= currentQuestion).length}</div>
                <div className="stat-label">Questions</div>
              </div>
            </div>

            <div className="results-actions">
              <button className="premium-button" onClick={fetchQuiz}>
                Take Another Quiz
              </button>
              <button className="premium-button button-success" onClick={onBack}>
                Back to Home
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Quiz;
