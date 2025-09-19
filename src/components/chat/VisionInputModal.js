'use client';

import React, { useState, useRef } from 'react';
import { Upload, Camera, FileImage, Check, AlertCircle } from 'lucide-react';
import Modal, { ModalHeader, ModalBody } from '../ui/Modal';
import { processImageForUpload, formatFileSize } from '../../lib/imageUtils';

export default function VisionInputModal({ 
  isOpen, 
  onClose, 
  onComplete, 
  onError 
}) {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleClose = () => {
    setPreview(null);
    setIsUploading(false);
    onClose();
  };

  const processFile = async (file) => {
    setIsUploading(true);

    try {
      // Process and compress the image
      const processedImage = await processImageForUpload(file, {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.7,
        maxSize: 5 * 1024 * 1024 // 5MB
      });
      
      // Create a preview URL from original file
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
      
      // Simulate OCR processing (in real implementation, this would call an OCR service)
      const ocrText = "Image uploaded successfully. Please describe what you'd like me to help you with regarding this image.";
      
      const result = {
        url: processedImage.base64,
        ocrText: ocrText,
        fileName: processedImage.fileName,
        fileSize: processedImage.compressedSize,
        originalFileSize: processedImage.originalSize,
        fileType: processedImage.fileType,
        compressionRatio: processedImage.compressionRatio
      };

      onComplete(result);
      setIsUploading(false);
    } catch (error) {
      console.error('Error processing file:', error);
      onError(error);
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      processFile(file);
    }
  };

  const handleCameraCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Upload Image" size="md">
      <ModalBody>
          {preview ? (
            /* Preview */
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg border border-gray-200 shadow-sm"
                />
                {isUploading && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center rounded-lg">
                    <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4 flex items-center space-x-3 shadow-lg">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="text-gray-700 font-medium">Processing...</span>
                    </div>
                  </div>
                )}
                {!isUploading && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </div>
              
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">
                  Image ready to send!
                </p>
                <p className="text-xs text-gray-500">
                  The image has been compressed for faster upload
                </p>
              </div>
            </div>
          ) : (
            /* Upload Options */
            <div className="space-y-4">
              {/* Drag and Drop Area */}
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50/50 scale-[1.02]'
                    : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50/50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <FileImage className={`w-12 h-12 mx-auto mb-4 transition-colors ${
                  dragActive ? 'text-blue-500' : 'text-gray-400'
                }`} />
                <p className="text-gray-600 mb-2 font-medium">
                  Drag and drop an image here, or
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                >
                  browse files
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 group"
                >
                  <Upload className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
                  <span className="text-gray-700 group-hover:text-blue-600 transition-colors font-medium">Choose File</span>
                </button>
                
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 group"
                >
                  <Camera className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
                  <span className="text-gray-700 group-hover:text-blue-600 transition-colors font-medium">Camera</span>
                </button>
              </div>

              {/* File Types */}
              <p className="text-xs text-gray-500 text-center">
                Supports JPG, PNG, GIF, WebP (max 5MB, auto-compressed)
              </p>
            </div>
          )}
      </ModalBody>

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCameraCapture}
        className="hidden"
      />
    </Modal>
  );
}
