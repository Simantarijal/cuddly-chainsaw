import SnakeGame from "@/components/game/snake-game";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <SnakeGame />
    </main>
  );
}
