import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle, Loader2, Download, AlertCircle } from 'lucide-react';
import { extractTextFromPDF } from './lib/pdfExtractor';
import { parseResumeStructure, tailorResumeDraft, reviewAndSelfCorrect, ResumeData } from './lib/aiTailor';
import { ResumePreview } from './components/ResumePreview';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

type Status = 'idle' | 'extracting' | 'parsing' | 'drafting' | 'reviewing' | 'success' | 'error';

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [jobRequirements, setJobRequirements] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resumeRef = useRef<HTMLDivElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== 'application/pdf') {
        setErrorMsg('Please upload a valid PDF file.');
        return;
      }
      setFile(selectedFile);
      setErrorMsg('');
      setResumeData(null);
      setStatus('idle');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type !== 'application/pdf') {
        setErrorMsg('Please upload a valid PDF file.');
        return;
      }
      setFile(droppedFile);
      setErrorMsg('');
      setResumeData(null);
      setStatus('idle');
    }
  };

  const handleTailor = async () => {
    if (!file) {
      setErrorMsg('Please upload your resume PDF first.');
      return;
    }
    if (!jobRequirements.trim()) {
      setErrorMsg('Please paste the job requirements.');
      return;
    }

    try {
      setErrorMsg('');
      
      // Step 0: Extract text
      setStatus('extracting');
      const rawText = await extractTextFromPDF(file);
      
      // Step 1: Parse Structure
      setStatus('parsing');
      const parsedResume = await parseResumeStructure(rawText);
      setResumeData(parsedResume); // Show initial parsed version
      
      // Step 2: Draft & Tailor
      setStatus('drafting');
      const draftResume = await tailorResumeDraft(parsedResume, jobRequirements);
      setResumeData(draftResume); // Show draft version
      
      // Step 3: Review & Self-Correct
      setStatus('reviewing');
      const finalResume = await reviewAndSelfCorrect(draftResume, jobRequirements);
      setResumeData(finalResume);
      
      setStatus('success');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'An error occurred during the tailoring process.');
      setStatus('error');
    }
  };

  const handleDownload = async () => {
    const element = document.getElementById('resume-to-print');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 3, // Even higher quality for professional look
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: 794, // 210mm at 96 DPI
        height: 1123, // 297mm at 96 DPI
        onclone: (clonedDoc) => {
          const el = clonedDoc.getElementById('resume-to-print');
          if (el) {
            el.style.boxShadow = 'none';
            el.style.margin = '0';
          }
          // Remove all stylesheets to prevent oklch parsing errors
          const styles = clonedDoc.getElementsByTagName('style');
          for (let i = styles.length - 1; i >= 0; i--) {
            styles[i].parentNode?.removeChild(styles[i]);
          }
          const links = clonedDoc.getElementsByTagName('link');
          for (let i = links.length - 1; i >= 0; i--) {
            if (links[i].rel === 'stylesheet') {
              links[i].parentNode?.removeChild(links[i]);
            }
          }
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('Tailored_Resume.pdf');
    } catch (err) {
      console.error('Failed to generate PDF', err);
      setErrorMsg('Failed to generate PDF. Please try again.');
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'extracting': return 'Reading PDF...';
      case 'parsing': return 'Analyzing Structure...';
      case 'drafting': return 'Drafting Tailored Content...';
      case 'reviewing': return 'Verifying Alignment...';
      case 'success': return 'Ready!';
      default: return 'Tailor My Resume';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-6 h-6 text-indigo-600" />
            <h1 className="text-xl font-bold tracking-tight">ResumeTailor AI</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-73px)]">
        
        {/* Left Panel: Input Zone */}
        <div className="flex flex-col space-y-6 overflow-y-auto pr-2 pb-8">
          
          <div>
            <h2 className="text-lg font-semibold mb-1">1. Upload Your Resume</h2>
            <p className="text-sm text-gray-500 mb-3">Upload your existing resume as a PDF.</p>
            
            <div 
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer
                ${file ? 'border-indigo-300 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'}`}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="application/pdf" 
                className="hidden" 
              />
              
              {file ? (
                <div className="flex flex-col items-center space-y-2">
                  <CheckCircle className="w-10 h-10 text-indigo-500" />
                  <span className="font-medium text-indigo-900">{file.name}</span>
                  <span className="text-xs text-indigo-600">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-2">
                  <UploadCloud className="w-10 h-10 text-gray-400" />
                  <span className="font-medium text-gray-700">Click to upload or drag and drop</span>
                  <span className="text-xs text-gray-500">PDF files only</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            <h2 className="text-lg font-semibold mb-1">2. Job Requirements</h2>
            <p className="text-sm text-gray-500 mb-3">Copy and paste the job description here.</p>
            <textarea
              className="flex-1 w-full rounded-xl border border-gray-300 p-4 min-h-[200px] focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none shadow-sm"
              placeholder="e.g. We are looking for a Senior Frontend Engineer with 5+ years of experience in React, TypeScript, and Tailwind CSS..."
              value={jobRequirements}
              onChange={(e) => setJobRequirements(e.target.value)}
            />
          </div>

          {errorMsg && (
            <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-start space-x-3 border border-red-100">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{errorMsg}</p>
            </div>
          )}

          <button
            onClick={handleTailor}
            disabled={['extracting', 'parsing', 'drafting', 'reviewing'].includes(status)}
            className={`w-full py-4 rounded-xl font-semibold text-white shadow-md transition-all flex items-center justify-center space-x-2
              ${['extracting', 'parsing', 'drafting', 'reviewing'].includes(status) 
                ? 'bg-indigo-400 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg active:scale-[0.98]'}`}
          >
            {['extracting', 'parsing', 'drafting', 'reviewing'].includes(status) && (
              <Loader2 className="w-5 h-5 animate-spin" />
            )}
            <span>{getStatusMessage()}</span>
          </button>
        </div>

        {/* Right Panel: Preview & Download Zone */}
        <div className="bg-gray-200 rounded-2xl p-6 flex flex-col items-center overflow-hidden relative shadow-inner border border-gray-300">
          <div className="w-full flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Preview</h2>
            {status === 'success' && resumeData && (
              <button
                onClick={handleDownload}
                className="flex items-center space-x-2 bg-white text-gray-800 px-4 py-2 rounded-lg font-medium shadow-sm hover:shadow border border-gray-200 transition-all active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </button>
            )}
          </div>
          
          <div className="flex-1 w-full overflow-auto flex justify-center items-start custom-scrollbar">
            {resumeData ? (
              <div className="transform origin-top scale-[0.6] sm:scale-[0.7] md:scale-[0.8] lg:scale-[0.6] xl:scale-[0.7] 2xl:scale-[0.8] transition-transform duration-300">
                <ResumePreview data={resumeData} ref={resumeRef} />
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                <FileText className="w-16 h-16 opacity-20" />
                <p className="text-center max-w-xs">
                  Upload your resume and paste job requirements to see the tailored preview here.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
