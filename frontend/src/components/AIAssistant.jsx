import { useState } from 'react'
import { FiMessageCircle, FiSend, FiX, FiCpu } from 'react-icons/fi'

const AIAssistant = () => {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: 'Hi! I\'m your BloodConnect assistant. Ask me about blood donation, eligibility, or finding donors!'
        }
    ])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSend = async () => {
        if (!input.trim() || loading) return

        const userMessage = input.trim()
        setInput('')

        // Add user message
        setMessages(prev => [...prev, { role: 'user', content: userMessage }])
        setLoading(true)

        try {
            // Simple rule-based responses for blood donation queries
            const response = getResponse(userMessage.toLowerCase())

            // Simulate API delay for better UX
            await new Promise(resolve => setTimeout(resolve, 500))

            setMessages(prev => [...prev, { role: 'assistant', content: response }])
        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.'
            }])
        } finally {
            setLoading(false)
        }
    }

    const getResponse = (query) => {
        // Blood donation eligibility
        if (query.includes('eligib') || query.includes('can i donate')) {
            return '✅ **Blood Donation Eligibility:**\n\n• Age: 18-65 years\n• Weight: At least 50 kg\n• Healthy and feeling well\n• No recent tattoos (3 months)\n• No recent illness or medication\n\nWould you like to know more about any specific requirement?'
        }

        // Blood types
        if (query.includes('blood type') || query.includes('blood group')) {
            return '🩸 **Blood Types:**\n\n• **O-**: Universal donor\n• **AB+**: Universal recipient\n• **A, B, AB, O**: Each with + or - Rh factor\n\nYour blood type determines who you can donate to and receive from!'
        }

        // Donation frequency
        if (query.includes('how often') || query.includes('frequency')) {
            return '⏰ **Donation Frequency:**\n\n• Whole blood: Every 56 days (8 weeks)\n• Platelets: Every 7 days\n• Plasma: Every 28 days\n\nYour body needs time to replenish!'
        }

        // Benefits
        if (query.includes('benefit') || query.includes('why donate')) {
            return '❤️ **Benefits of Donating:**\n\n• Save up to 3 lives per donation\n• Free health screening\n• Reduces risk of heart disease\n• Burns calories (~650 per donation)\n• Feel good helping others!\n\nEvery donation makes a difference!'
        }

        // Side effects
        if (query.includes('side effect') || query.includes('after donation')) {
            return '💡 **After Donation:**\n\n**Normal:**\n• Slight tiredness\n• Mild bruising\n• Thirst\n\n**Tips:**\n• Drink plenty of fluids\n• Eat iron-rich foods\n• Rest if needed\n• Avoid heavy exercise for 24h\n\nContact us if you feel unwell!'
        }

        // Finding donors
        if (query.includes('find donor') || query.includes('need blood')) {
            return '🔍 **Finding Donors:**\n\n1. Click "Blood Map" to see nearby donors\n2. Filter by blood type\n3. Send a request\n4. Donors will be notified\n\nYou can also create an urgent request from your dashboard!'
        }

        // Process
        if (query.includes('process') || query.includes('how to donate')) {
            return '📋 **Donation Process:**\n\n1. Register on BloodConnect\n2. Complete health questionnaire\n3. Schedule appointment\n4. Visit donation center\n5. Quick health check (10 min)\n6. Donate blood (10-15 min)\n7. Rest and refreshments\n\nTotal time: ~1 hour'
        }

        // Default response
        return '🤖 I can help you with:\n\n• Donation eligibility\n• Blood types and compatibility\n• Donation frequency\n• Benefits and side effects\n• Finding donors\n• Donation process\n\nWhat would you like to know?'
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 p-4 bg-linear-to-r from-red-500 to-red-600 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all z-50 flex items-center gap-2"
            >
                <FiMessageCircle className="text-xl" />
                <span className="font-semibold">Chat</span>
            </button>
        )
    }

    return (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 flex flex-col">
            {/* Header */}
            <div className="bg-linear-to-r from-red-500 to-red-600 p-4 rounded-t-2xl flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                        <FiCpu className="text-xl" />
                    </div>
                    <div>
                        <h3 className="font-bold">BloodConnect AI</h3>
                        <p className="text-xs text-white/80">Always here to help</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                    <FiX className="text-xl" />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === 'user'
                                    ? 'bg-red-500 text-white rounded-br-none'
                                    : 'bg-white text-gray-800 rounded-bl-none shadow-sm border border-gray-100'
                                }`}
                        >
                            <p className="text-sm whitespace-pre-line leading-relaxed">
                                {msg.content}
                            </p>
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-white rounded-2xl rounded-bl-none px-4 py-3 shadow-sm border border-gray-100">
                            <div className="flex gap-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-gray-200 rounded-b-2xl">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask me anything..."
                        className="flex-1 px-4 py-3 bg-gray-100 rounded-xl border-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all text-sm"
                        disabled={loading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || loading}
                        className="px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <FiSend />
                    </button>
                </div>
            </div>
        </div>
    )
}

export default AIAssistant
