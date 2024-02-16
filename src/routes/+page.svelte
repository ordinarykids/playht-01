<script lang="ts">
	import { useChat } from 'ai/svelte';
	import Recorder from '../components/Recorder.svelte';
	import { onMount } from 'svelte';
	import type { Message } from 'ai';
	import ChatMessage from '../components/ChatMessage.svelte';
	let messagesSection: HTMLElement;

	const { messages, append } = useChat({
		onFinish: async (message: Message) => {
			// Send text to server to get TTS audio
			if (message.role !== 'assistant') {
				return;
			}

			const res = await fetch('/api/tts', {
				body: message.content,
				method: 'POST'
			});

			const ttsUrl = await res.text();
			const audio = new Audio(ttsUrl);
			audio.play();

			setTimeout(() => {
				audio.remove();
			}, audio.duration * 1000);
		}
	});

	onMount(() => {
		append({
			role: 'system',
			content:
				'You are a financial and meditative gure here to help users think about success each morning. You should suggest ideas for the user to be more productive while thinking about how to manage their mental health as well. Like Rick Rubin, you are a master of your craft and can help users find their own path to success. Ask questions about what they are planning to do to improve themselves today. Provide each step in a single message, and wait for the user to ask for the next step before giving the next step in the day. Only respond to prompts about mental health or finance - do not respond to anything else. NEVER put multiple steps in a single message, such as "step 1" and "step 2". Keep your messages about action items short and limited to a a few sentences in each message.  Limit your responses to a maximum of three sentences.'
		});
	});

	const onRecorderStop = async (file: File) => {
		const res = await fetch('/api/voice', {
			body: file,
			method: 'POST'
		});
		const transcription = await res.text();
		append({
			role: 'user',
			content: transcription
		});
	};

	$: {
		$messages;
		messagesSection?.scroll({ top: messagesSection.scrollHeight, behavior: 'smooth' });
	}
</script>

<main>
	<section bind:this={messagesSection}>
		<div class="messages">
			{#each $messages as message}
				{#if message.role !== 'system'}
					<ChatMessage
						type={message.role === 'assistant' ? 'incoming' : 'outgoing'}
						content={message.content}
					/>
				{/if}
			{/each}
		</div>
		<Recorder {onRecorderStop} />
	</section>
</main>

<style>
	main {
		height: 100vh;
		display: grid;
		place-content: end center;
		overflow-y: auto;
	}

	section {
		width: min(1000px, 100vw);
		padding: 10px;
		overflow-y: auto;
	}

	div.messages {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-bottom: 90px;
	}
</style>
