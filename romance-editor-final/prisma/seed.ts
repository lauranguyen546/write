import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SAMPLE_TEXT = `Chapter One

Emma stared at the rejection email, her heart sinking. Another publisher, another "not quite right for our list." She'd spent three years on this manuscript, pouring her heart into every word, every scene, every character arc.

"Bad news?" Jake's voice came from behind her.

She jumped, quickly minimizing the email. "Just... work stuff."

He leaned against her desk, arms crossed, that infuriating smirk playing at his lips. "You're a terrible liar, Em."

"And you're a terrible boss," she shot back, but there was no heat in it. After six months working as his assistant, she'd learned that beneath the sharp suits and sharper tongue, Jake Martinez actually had a heart. She just wished he'd stop making it so hard to hate him.

***

The office holiday party was in full swing when Emma found herself cornered by the copy machine. Not by Jake this time, but by Derek from accounting, whose breath smelled like eggnog and desperation.

"So, Emma, I was thinking—"

"Derek, I really need to—"

"Just hear me out. You and me, we'd make a great team. I mean, I handle numbers, you handle words..."

"That's not really how chemistry works," she muttered, scanning the room for an escape route.

And that's when she saw him. Jake, watching from across the room, jaw tight, that muscle in his cheek twitching the way it did when he was annoyed. Their eyes met, and something electric passed between them.

He was there in three strides.

"Emma, we need to discuss the Morrison proposal. Now." His hand was on her elbow, warm and firm, and she let herself be steered away from Derek's fumbling attempts at romance.

"There is no Morrison proposal," she whispered once they were in the hallway.

"I know." His voice was rough. "I just... I couldn't watch him anymore."

Her breath caught. "Jake—"

"Don't." He stepped closer, close enough that she could smell his cologne, something woodsy and expensive. "Don't say whatever you're about to say. Not yet."

The air between them crackled with unspoken words, with months of tension and denial and something that felt dangerously like hope.`;

async function main() {
  console.log('Seeding database...');

  // Create a demo project
  const project = await prisma.project.create({
    data: {
      id: crypto.randomUUID(),
      title: 'Office Romance - Demo Project',
      settingsJson: JSON.stringify({
        subgenre: 'contemporary',
        heatLevel: 'open-door',
        tropes: ['enemies-to-lovers', 'forced-proximity'],
        povStyle: 'third-limited',
        targetTone: 'punchy',
      }),
    },
  });

  console.log('Created demo project:', project.id);

  // Create a sample manuscript
  const manuscript = await prisma.manuscript.create({
    data: {
      id: crypto.randomUUID(),
      projectId: project.id,
      originalText: SAMPLE_TEXT,
    },
  });

  console.log('Created sample manuscript:', manuscript.id);

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
