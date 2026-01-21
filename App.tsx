
import React, { useState, useRef } from 'react';
import { Button } from './components/Button';
import { editImage, generateCaption } from './services/gemini';
import { ImageState, CaptionState, Tone } from './types';

type Tab = 'editor' | 'caption';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('editor');
  const [isCopied, setIsCopied] = useState(false);
  const [imageState, setImageState] = useState<ImageState>({
    original: null,
    edited: null,
    loading: false,
    error: null
  });

  const [captionState, setCaptionState] = useState<CaptionState & { instruction: string }>({
    text: null,
    loading: false,
    tone: 'Professional',
    instruction: ''
  });

  const [instruction, setInstruction] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageState({
          original: e.target?.result as string,
          edited: null,
          loading: false,
          error: null
        });
        setCaptionState(prev => ({ ...prev, text: null }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = async () => {
    if (!imageState.original || !instruction) return;
    
    setImageState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const result = await editImage(imageState.original, instruction);
      setImageState(prev => ({ ...prev, edited: result, loading: false }));
    } catch (err: any) {
      setImageState(prev => ({ ...prev, loading: false, error: err.message || 'Failed to edit image' }));
    }
  };

  const handleGenerateCaption = async () => {
    const activeImage = imageState.edited || imageState.original;
    if (!activeImage) return;

    setCaptionState(prev => ({ ...prev, loading: true }));
    try {
      const text = await generateCaption(activeImage, captionState.tone, captionState.instruction);
      setCaptionState(prev => ({ ...prev, text, loading: false }));
    } catch (err) {
      setCaptionState(prev => ({ ...prev, loading: false }));
    }
  };

  const handleCopy = async () => {
    if (!captionState.text) return;
    try {
      await navigator.clipboard.writeText(captionState.text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const downloadImage = (imageUrl: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = 'auka-ai-image.png';
    link.click();
  };

  const reset = () => {
    setImageState({ original: null, edited: null, loading: false, error: null });
    setCaptionState({ text: null, loading: false, tone: 'Professional', instruction: '' });
    setInstruction('');
    setActiveTab('editor');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen pb-20 bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-gray-200 py-4 px-6 mb-8">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 cursor-pointer" onClick={reset}>
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                <svg className="text-white w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight hidden sm:block">AukaAI <span className="text-indigo-600">Studio</span></h1>
            </div>

            {imageState.original && (
              <nav className="flex gap-1 p-1 bg-gray-100/80 rounded-2xl">
                <button 
                  onClick={() => setActiveTab('editor')}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === 'editor' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Image Editor
                </button>
                <button 
                  onClick={() => setActiveTab('caption')}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === 'caption' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Caption Generator
                </button>
              </nav>
            )}
          </div>

          <div className="flex items-center gap-3">
            {imageState.original && (
              <Button variant="secondary" onClick={reset} className="!px-4 !py-2 text-xs uppercase tracking-wider">
                Reset
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6">
        {!imageState.original ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="max-w-xl">
              <h2 className="text-5xl font-black text-slate-900 mb-6 leading-tight">
                AI Magic for your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Visuals</span>.
              </h2>
              <p className="text-xl text-slate-500 mb-10 leading-relaxed">
                Upload a photo to access our professional editing suite and smart caption generator.
              </p>
              
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="group cursor-pointer border-2 border-dashed border-slate-300 rounded-[2.5rem] p-16 transition-all hover:border-indigo-400 hover:bg-white hover:shadow-2xl hover:shadow-indigo-100"
              >
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform mb-6 border border-indigo-100">
                    <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <p className="text-xl font-bold text-slate-900">Drop your image here</p>
                  <p className="text-slate-500 mt-2">or click to browse from device</p>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleFileUpload}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Image Preview - Shows Original */}
            <div className="space-y-6 lg:sticky lg:top-28">
              <div className="relative group overflow-hidden rounded-[2.5rem] bg-white border border-slate-200 shadow-2xl shadow-slate-200/50 aspect-square flex items-center justify-center p-2">
                <img 
                  src={imageState.original} 
                  alt="Original workspace"
                  className="w-full h-full object-contain rounded-3xl"
                />
                <div className="absolute top-6 left-6">
                  <div className="px-4 py-1.5 bg-white/90 backdrop-blur-md text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm border border-slate-100">
                    Source Image
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button 
                  onClick={() => downloadImage(imageState.original!)} 
                  variant="secondary" 
                  className="flex-1 rounded-2xl h-14"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Source
                </Button>
              </div>
            </div>

            {/* Dynamic Tools Section */}
            <div className="space-y-6">
              {activeTab === 'editor' ? (
                <div className="space-y-6">
                  <section className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm animate-fade-in">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-black text-slate-900">Image Editor</h3>
                      <span className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </span>
                    </div>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Modification Instructions</label>
                        <textarea
                          placeholder="Tell AI what to do... (e.g., 'Remove background', 'Enhance lighting', 'Change sky to sunset')"
                          className="w-full h-32 p-5 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-none resize-none bg-slate-50 text-slate-900 placeholder-slate-400"
                          value={instruction}
                          onChange={(e) => setInstruction(e.target.value)}
                        />
                      </div>

                      <Button 
                        onClick={handleEdit} 
                        isLoading={imageState.loading} 
                        className="w-full rounded-2xl h-14 text-lg"
                        disabled={!instruction}
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" />
                        </svg>
                        Apply Magic
                      </Button>
                      
                      {imageState.error && (
                        <div className="p-4 bg-red-50 text-red-600 text-sm rounded-2xl border border-red-100 flex items-start gap-3">
                           <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {imageState.error}
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Modified Result Section - Appears below Editor */}
                  {(imageState.edited || imageState.loading) && (
                    <section className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm animate-fade-in overflow-hidden">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-black text-slate-900">Modified Result</h3>
                        <div className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-green-100">
                          AI Generated
                        </div>
                      </div>

                      <div className="relative aspect-square bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden flex items-center justify-center">
                        {imageState.loading ? (
                          <div className="flex flex-col items-center">
                            <div className="w-12 h-12 relative mb-4">
                              <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
                              <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                            </div>
                            <p className="text-sm font-bold text-slate-600">Processing Magic...</p>
                          </div>
                        ) : (
                          <img src={imageState.edited!} alt="AI result" className="w-full h-full object-contain" />
                        )}
                      </div>

                      {!imageState.loading && imageState.edited && (
                        <div className="mt-6">
                          <Button 
                            variant="primary" 
                            className="w-full h-12 rounded-xl"
                            onClick={() => downloadImage(imageState.edited!)}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download Edited Image
                          </Button>
                        </div>
                      )}
                    </section>
                  )}
                </div>
              ) : (
                <section className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm animate-fade-in">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black text-slate-900">Caption Generator</h3>
                    <span className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                    </span>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Context & Instructions</label>
                      <textarea
                        placeholder="Optional: Add details about the image or specific hashtags to include..."
                        className="w-full h-28 p-5 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all outline-none resize-none bg-slate-50 text-slate-900 placeholder-slate-400"
                        value={captionState.instruction}
                        onChange={(e) => setCaptionState(prev => ({ ...prev, instruction: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Select Tone</label>
                      <div className="grid grid-cols-2 gap-3">
                        {(['Professional', 'Persuasive', 'Minimalist', 'Luxury'] as Tone[]).map((t) => (
                          <button
                            key={t}
                            onClick={() => setCaptionState(prev => ({ ...prev, tone: t }))}
                            className={`p-4 rounded-2xl text-sm font-bold transition-all border-2 ${
                              captionState.tone === t 
                              ? 'bg-gradient-to-br from-purple-600 to-indigo-600 border-transparent text-white shadow-xl shadow-purple-200 scale-[1.02]' 
                              : 'bg-white border-slate-100 text-slate-500 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-600'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    <Button 
                      onClick={handleGenerateCaption} 
                      isLoading={captionState.loading}
                      variant="primary"
                      className="w-full !bg-purple-600 hover:!bg-purple-700 rounded-2xl h-14 text-lg"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Generate Copy
                    </Button>

                    {captionState.text && (
                      <div className="relative group bg-purple-50/30 p-6 pb-14 rounded-2xl border border-purple-100 animate-fade-in shadow-inner">
                        <p className="text-slate-800 font-medium leading-relaxed">{captionState.text}</p>
                        
                        <div className="absolute bottom-4 right-4 flex items-center gap-2">
                          {isCopied && (
                            <span className="text-[10px] font-bold text-purple-600 uppercase tracking-tighter animate-bounce">
                              Copied!
                            </span>
                          )}
                          <button 
                            onClick={handleCopy}
                            className={`p-2 bg-white rounded-xl shadow-md border border-purple-100 transition-all active:scale-90 ${
                              isCopied ? 'bg-purple-50 border-purple-300 scale-105' : 'hover:scale-105'
                            }`}
                            title="Copy to clipboard"
                          >
                            {isCopied ? (
                              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="mt-20 py-10 text-center">
        <div className="flex justify-center gap-4 mb-4">
           <div className="w-2 h-2 rounded-full bg-indigo-200"></div>
           <div className="w-2 h-2 rounded-full bg-purple-200"></div>
           <div className="w-2 h-2 rounded-full bg-pink-200"></div>
        </div>
        <p className="text-slate-400 text-sm font-medium tracking-wide">© {new Date().getFullYear()} AUKA AI STUDIO • AI POWERED CREATIVITY</p>
      </footer>
    </div>
  );
};

export default App;
