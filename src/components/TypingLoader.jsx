import { motion } from 'framer-motion';

const TypingLoader = () => {
    return (
        <div className="flex gap-2 justify-center">
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5],
                }}
                transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: 0,
                }}
                className="w-2 h-2 bg-gray-500 rounded-full"
            />
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5],
                }}
                transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: 0.2,
                }}
                className="w-2 h-2 bg-gray-500 rounded-full"
            />
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5],
                }}
                transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: 0.4,
                }}
                className="w-2 h-2 bg-gray-500 rounded-full"
            />
        </div>
    );
};

export default TypingLoader;
