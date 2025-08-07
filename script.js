// Get DOM elements
        const messageInput = document.getElementById('messageInput');
        const sendBtn = document.getElementById('sendBtn');
        const chatMessages = document.getElementById('chatMessages');
        const thinkingIndicator = document.getElementById('thinkingIndicator');

        // Auto-resize textarea
        messageInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 200) + 'px';
            
            // Enable/disable send button
            sendBtn.disabled = !this.value.trim();
        });

        // Send message function
        async function sendMessage() {
            const message = messageInput.value.trim();
            if (!message) return;

            // Add user message to chat
            addMessage(message, 'user');
            
            // Clear input
            messageInput.value = '';
            messageInput.style.height = 'auto';
            sendBtn.disabled = true;

            // Show thinking indicator
            showThinking(true);

            try {
                // Make API request
                const response = await fetch('https://supportify-bob-ai.onrender.com/generate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        question: message,
                        conversation_id: getConversationId()
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                
                // Add assistant response
                addMessage(data.answer || data.response || 'I apologize, but I couldn\'t generate a response.', 'assistant');

            } catch (error) {
                console.error('Error:', error);
                addMessage('Sorry, I encountered an error. Please try again.', 'assistant', true);
            } finally {
                showThinking(false);
            }
        }

        // Format AI message text for HTML rendering
        function formatMessageText(text) {
            // Escape HTML special characters
            text = text.replace(/[&<>]/g, function(tag) {
                const chars = { '&': '&amp;', '<': '&lt;', '>': '&gt;' };
                return chars[tag] || tag;
            });

            // Bold: **text**
            text = text.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
            // Italic: *text*
            text = text.replace(/\*(.+?)\*/g, '<i>$1</i>');

            // Numbered lists: 1. item
            text = text.replace(/(^|\n)(\d+\.\s.+)(?=(\n|$))/g, function(match, p1, p2) {
                // Split lines for multiple list items
                const items = p2.split(/\n(?=\d+\.\s)/g);
                if (items.length > 1) {
                    return p1 + '<ol>' + items.map(i => '<li>' + i.replace(/^\d+\.\s/, '') + '</li>').join('') + '</ol>';
                } else {
                    return p1 + '<ol><li>' + p2.replace(/^\d+\.\s/, '') + '</li></ol>';
                }
            });

            // Bullet points: - item or * item
            text = text.replace(/(^|\n)((?:[-*]\s.+\n?)+)/g, function(match, p1, p2) {
                const items = p2.trim().split(/\n/).filter(line => /^[-*]\s/.test(line));
                if (items.length > 0) {
                    return p1 + '<ul>' + items.map(i => '<li>' + i.replace(/^[-*]\s/, '') + '</li>').join('') + '</ul>';
                }
                return match;
            });

            // Line breaks
            text = text.replace(/\n/g, '<br>');

            return text;
        }

        // Add message to chat
        function addMessage(text, sender, isError = false) {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message';
            
            const isAssistant = sender === 'assistant';
            const avatarClass = isAssistant ? 'assistant-avatar' : 'user-avatar';
            const avatarText = isAssistant ? 'S' : 'U';
            const senderName = isAssistant ? 'Supportfy' : 'You';

            // Format assistant message text for HTML
            const displayText = isAssistant ? formatMessageText(text) : text;

            messageDiv.innerHTML = `
                <div class="message-avatar ${avatarClass}">${avatarText}</div>
                <div class="message-content">
                    <div class="message-header">
                        <span class="message-sender">${senderName}</span>
                        ${isAssistant ? '<span class="message-actions"></span>' : ''}
                    </div>
                    <div class="message-text ${isError ? 'error' : ''}">${displayText}</div>
                </div>
            `;
            
            // Insert before thinking indicator
            chatMessages.insertBefore(messageDiv, thinkingIndicator);
            
            // Scroll to bottom
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        // Show/hide thinking indicator
        function showThinking(show) {
            thinkingIndicator.style.display = show ? 'flex' : 'none';
            if (show) {
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        }

        // Get or create conversation ID
        function getConversationId() {
            let conversationId = sessionStorage.getItem('supportfy_conversation_id');
            if (!conversationId) {
                conversationId = 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                sessionStorage.setItem('supportfy_conversation_id', conversationId);
            }
            return conversationId;
        }

        // Event listeners
        sendBtn.addEventListener('click', sendMessage);

        messageInput.addEventListener('keydown', function(event) {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                if (!sendBtn.disabled) {
                    sendMessage();
                }
            }
        });

        // Initialize
        sendBtn.disabled = true;
        messageInput.focus();

        // Add some example interactions (for demo purposes)
        setTimeout(() => {
            const examples = [
                "What is machine learning?",
                "Explain quantum physics simply",
                "How do I start learning programming?"
            ];
            
            console.log('Try asking: ' + examples[Math.floor(Math.random() * examples.length)]);
        }, 2000);
