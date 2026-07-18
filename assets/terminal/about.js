const commands = [
{
prompt:"$ whoami",
output:"Full Stack Developer (MERN) & AI Engineer"
},
{
prompt:"$ cat current_focus.txt",
output:"Building AI-powered software with LLMs & Agentic AI"
},
{
prompt:"$ ls expertise/",
output:[
"backend/",
"distributed-systems/",
"cloud-computing/",
"machine-learning/",
"computer-vision/"
]
},
{
prompt:"$ echo $MISSION",
output:"Design scalable AI systems for production."
}
];

const typingSpeed = 60;
const commandDelay = 500;
const restartDelay = 5000;

console.log(commands);