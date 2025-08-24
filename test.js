import { pipeline } from '@huggingface/transformers';

process.env['HF_TOKEN'] = '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';

const answerer = await pipeline('question-answering', 'Xenova/distilbert-base-cased-distilled-squad');
const question = 'Wha tis 2 + 2?';
const context = 'you are a helpful math robot';
const output = await answerer(question, context);
console.log('output: ', output);
