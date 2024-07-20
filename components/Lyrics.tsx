'use client'

import React from 'react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface TranslatedWord {
    original: string;
    translated: string;
}

interface TranslatedLyricsLine {
    timestamp: string;
    text: string;
    translatedWords: TranslatedWord[];
    translatedText: string;
}

interface Props {
    translatedLyrics: TranslatedLyricsLine[];
}

const Lyrics: React.FC<Props> = ({ translatedLyrics }) => {

    return (
        <div>
            <TooltipProvider>
                {translatedLyrics.map((line, lineIndex) => (
                    <div key={lineIndex} className='border-solid border-2 my-2 p-1 relative rounded-md bg-gray-200'>
                        <p className='flex flex-wrap gap-2'>
                            {line.translatedWords.map((word, wordIndex) => (
                                <span key={wordIndex}>
                                    <Tooltip>
                                        <TooltipTrigger className='p-1 rounded-md hover:bg-sky-400'>
                                            {word.original}
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{word.translated}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                    {wordIndex === line.translatedWords.length - 1 && (
                                        <Tooltip>
                                            <TooltipTrigger className="inline-block w-3 h-3 bg-gray-500 rounded-full ml-5 cursor-pointer">
                                                {/* Dot or any small clickable element */}
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{line.translatedText}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    )}
                                </span>
                            ))}
                        </p>
                    </div>
                ))}
            </TooltipProvider>
        </div>
    );
};

export default Lyrics;
