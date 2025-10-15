import React from 'react'

const Card = ({ icon, title, desc, stepNo, addSteps }) => {
    return (
        <div className={`flex flex-col bg-white justify-center items-center gap-2 rounded-2xl ${addSteps ? "h-58" : "h-52"} p-3 overflow-hidden scale-95 hover:scale-105`}>
            {addSteps && <div className="absolute top-4 left-4 bg-indigo-600 text-white w-10 h-10 flex items-center justify-center rounded-full font-bold shadow-md">
                {stepNo}
            </div>}
            <span>{icon}</span>
            <h3 className="font-semibold md:text-lg text-center">{title}</h3>
            <p className="mb-3 text-gray-600 text-center">{desc}</p>
        </div>
    )
}

export default Card