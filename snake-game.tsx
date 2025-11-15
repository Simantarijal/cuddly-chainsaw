"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCw, Play, Pause } from 'lucide-react';

const GRID_SIZE = 20;
const INITIAL_SPEED_MS = 200;
const MIN_SPEED_MS = 50;
const SPEED_INCREMENT = 5;

type Point = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

const getRandomCoordinate = () => ({
  x: Math.floor(Math.random() * GRID_SIZE),
  y: Math.floor(Math.random() * GRID_SIZE),
});

const createInitialState = () => ({
  snake: [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ],
  food: getRandomCoordinate(), // Initial food position
  direction: 'RIGHT' as Direction,
  speed: INITIAL_SPEED_MS,
  score: 0,
  isGameOver: false,
  isRunning: true,
});

export default function SnakeGame() {
  const [gameState, setGameState] = useState(() => ({
    ...createInitialState(),
    food: { x: -1, y: -1 }, // Start with food off-screen to prevent hydration mismatch
  }));
  const { snake, food, direction, speed, score, isGameOver, isRunning } = gameState;

  // Use a ref for direction to get the latest value inside the setInterval callback
  const directionRef = useRef(direction);
  directionRef.current = direction;

  useEffect(() => {
    // Set initial food position on the client to avoid hydration mismatch
    if (food.x === -1) {
      setGameState(prev => ({...prev, food: getRandomCoordinate()}));
    }
  }, [food.x]);

  const gameLoop = useCallback(() => {
    setGameState(prev => {
      if (prev.isGameOver || !prev.isRunning) return prev;

      const newSnake = [...prev.snake];
      const head = { ...newSnake[0] };

      switch (directionRef.current) {
        case 'UP': head.y -= 1; break;
        case 'DOWN': head.y += 1; break;
        case 'LEFT': head.x -= 1; break;
        case 'RIGHT': head.x += 1; break;
      }

      // Wall collision
      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        return { ...prev, isGameOver: true, isRunning: false };
      }

      // Self collision
      for (const segment of newSnake.slice(1)) { // Check against the rest of the body
        if (segment.x === head.x && segment.y === head.y) {
          return { ...prev, isGameOver: true, isRunning: false };
        }
      }

      newSnake.unshift(head);

      let newFood = prev.food;
      let newScore = prev.score;
      let newSpeed = prev.speed;

      // Food consumption
      if (head.x === prev.food.x && head.y === prev.food.y) {
        newScore += 10;
        newSpeed = Math.max(MIN_SPEED_MS, prev.speed - SPEED_INCREMENT);
        
        let foodIsOnSnake = true;
        while(foodIsOnSnake) {
          newFood = getRandomCoordinate();
          foodIsOnSnake = newSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
        }
      } else {
        newSnake.pop();
      }
      
      return {
        ...prev,
        snake: newSnake,
        food: newFood,
        score: newScore,
        speed: newSpeed
      };
    });
  }, []);

  useEffect(() => {
    if (isRunning && !isGameOver) {
      const timer = setInterval(gameLoop, speed);
      return () => clearInterval(timer);
    }
  }, [isRunning, isGameOver, speed, gameLoop]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    e.preventDefault();
    setGameState(prev => {
      if (prev.isGameOver && e.key === 'Enter') {
          return createInitialState();
      }
      
      let newDirection = prev.direction;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
          if (prev.direction !== 'DOWN') newDirection = 'UP';
          break;
        case 'ArrowDown':
        case 's':
          if (prev.direction !== 'UP') newDirection = 'DOWN';
          break;
        case 'ArrowLeft':
        case 'a':
          if (prev.direction !== 'RIGHT') newDirection = 'LEFT';
          break;
        case 'ArrowRight':
        case 'd':
          if (prev.direction !== 'LEFT') newDirection = 'RIGHT';
          break;
        case ' ': // Space bar
          if(!prev.isGameOver) {
            return { ...prev, isRunning: !prev.isRunning };
          }
          break;
      }
      return { ...prev, direction: newDirection };
    });
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
  
  const handleRestart = () => {
    const newState = createInitialState();
    // Ensure the new food position is not on the snake
    let foodIsOnSnake = true;
    while(foodIsOnSnake) {
        newState.food = getRandomCoordinate();
        foodIsOnSnake = newState.snake.some(segment => segment.x === newState.food.x && segment.y === newState.food.y);
    }
    setGameState(newState);
  };

  const handleTogglePause = () => {
    if (!isGameOver) {
        setGameState(prev => ({...prev, isRunning: !prev.isRunning}));
    }
  }

  const handleDirectionChange = (newDirection: Direction) => {
    setGameState(prev => {
        const currentDirection = prev.direction;
        if (
            (newDirection === 'UP' && currentDirection !== 'DOWN') ||
            (newDirection === 'DOWN' && currentDirection !== 'UP') ||
            (newDirection === 'LEFT' && currentDirection !== 'RIGHT') ||
            (newDirection === 'RIGHT' && currentDirection !== 'LEFT')
        ) {
            return {...prev, direction: newDirection};
        }
        return prev;
    });
  }

  return (
    <Card className="w-full max-w-lg lg:max-w-xl text-center border-2 shadow-2xl bg-card/80">
      <CardHeader>
        <CardTitle className="text-3xl lg:text-4xl font-headline tracking-widest">
          SERPENTINE SURVIVAL
        </CardTitle>
        <div className="flex justify-between items-center pt-4">
            <p className="text-xl font-headline">SCORE: {score}</p>
            <div className="flex items-center gap-2">
                <Button onClick={handleTogglePause} variant="outline" size="icon" aria-label={isRunning ? "Pause Game" : "Play Game"}>
                    {isRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </Button>
                <Button onClick={handleRestart} variant="outline" size="icon" aria-label="Restart Game">
                    <RotateCw className="h-5 w-5" />
                </Button>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <div 
            className="relative bg-background rounded-md aspect-square grid border-2 border-border"
            style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`, gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`}}
        >
          {isGameOver && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm rounded-md">
              <h2 className="text-5xl font-bold font-headline text-destructive animate-pulse">GAME OVER</h2>
              <p className="mt-4 text-2xl font-headline">FINAL SCORE: {score}</p>
              <Button onClick={handleRestart} className="mt-8">
                <RotateCw className="mr-2 h-4 w-4" /> RESTART
              </Button>
            </div>
          )}
          {!isGameOver && !isRunning && (
             <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm rounded-md">
              <h2 className="text-5xl font-bold font-headline text-foreground">PAUSED</h2>
              <p className="mt-4 text-lg font-headline">Press SPACE to resume</p>
            </div>
          )}
          {snake.map((segment, index) => (
            <div 
              key={index}
              className={`rounded-[2px] transition-all duration-75 ${index === 0 ? 'bg-primary' : 'bg-primary/80'}`}
              style={{ gridColumn: segment.x + 1, gridRow: segment.y + 1, transform: 'scale(1.05)' }}
            />
          ))}
          { food.x >= 0 && <div 
            className="bg-accent rounded-full animate-pulse"
            style={{ gridColumn: food.x + 1, gridRow: food.y + 1, transform: 'scale(1.1)' }}
          />}
        </div>
        <div className="mt-6 flex flex-col items-center gap-2 lg:hidden">
            <Button size="lg" className="w-20" onClick={() => handleDirectionChange('UP')}><ArrowUp className="h-6 w-6" /></Button>
            <div className="flex gap-2">
                <Button size="lg" className="w-20" onClick={() => handleDirectionChange('LEFT')}><ArrowLeft className="h-6 w-6" /></Button>
                <Button size="lg" className="w-20" onClick={() => handleDirectionChange('DOWN')}><ArrowDown className="h-6 w-6" /></Button>
                <Button size="lg" className="w-20" onClick={() => handleDirectionChange('RIGHT')}><ArrowRight className="h-6 w-6" /></Button>
            </div>
        </div>
        <div className="hidden lg:block mt-4 text-muted-foreground text-sm">
            Use Arrow Keys or WASD to move. Press Space to pause/resume.
        </div>
      </CardContent>
    </Card>
  );
}
