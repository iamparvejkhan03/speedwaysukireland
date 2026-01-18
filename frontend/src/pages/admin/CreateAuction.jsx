import { useState } from 'react';
import { useForm } from 'react-hook-form';
import parse from 'html-react-parser';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import {
    FileText,
    PoundSterling,
    Settings,
    CheckCircle,
    ArrowLeft,
    ArrowRight,
    X,
    Image,
    File,
    Clock,
    MapPin,
    Gavel,
    Youtube,
    Car,
    Cog,
    Trophy,
    Move,
    Fuel,
    Gauge,
    Calendar,
    User,
    Search
} from "lucide-react";
import { RTE, AdminContainer, AdminHeader, AdminSidebar, VehicleLookupModal } from '../../components';
import toast from 'react-hot-toast';
import axiosInstance from '../../utils/axiosInstance.js';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import axios from 'axios';

// Drag and Drop item types
const ItemTypes = {
    PHOTO: 'photo',
};

// Draggable Photo Component
const DraggablePhoto = ({ photo, index, movePhoto, removePhoto, caption, onCaptionChange }) => {
    const [, ref] = useDrag({
        type: ItemTypes.PHOTO,
        item: { index },
    });

    const [, drop] = useDrop({
        accept: ItemTypes.PHOTO,
        hover: (draggedItem) => {
            if (draggedItem.index !== index) {
                movePhoto(draggedItem.index, index);
                draggedItem.index = index;
            }
        },
    });

    return (
        <div className="space-y-2">
            {/* Image with drag/drop */}
            <div ref={(node) => ref(drop(node))} className="relative group">
                <img
                    src={URL.createObjectURL(photo)}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg cursor-move"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center">
                    <Move size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </div>
                <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-full z-10">
                    {index + 1}
                </div>
                <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors z-20"
                >
                    <X size={14} />
                </button>
            </div>

            {/* Caption input - moved outside the draggable area */}
            <input
                type="text"
                placeholder="Add caption..."
                value={caption || ''}
                onChange={(e) => onCaptionChange(index, e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-black focus:border-black"
            />
        </div>
    );
};

// Photo Gallery Component
const PhotoGallery = ({ photos, movePhoto, removePhoto, captions, onCaptionChange }) => {
    return (
        <div className="mt-4">
            <p className="text-sm text-secondary mb-3">
                Drag and drop to reorder photos. The first image will be the main thumbnail.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {photos.map((photo, index) => (
                    <DraggablePhoto
                        key={`photo-${index}`}
                        photo={photo}
                        index={index}
                        movePhoto={movePhoto}
                        removePhoto={removePhoto}
                        caption={captions[index] || ''} // Pass caption
                        onCaptionChange={onCaptionChange} // Pass caption change handler
                    />
                ))}
            </div>
        </div>
    );
};

// Service History Gallery Component
const ServiceHistoryGallery = ({ serviceRecords, moveServiceRecord, removeServiceRecord, captions, onCaptionChange }) => {
    return (
        <div className="mt-4">
            <p className="text-sm text-secondary mb-3">
                Drag and drop to reorder service history images.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {serviceRecords.map((record, index) => (
                    <DraggablePhoto
                        key={`record-${index}`}
                        photo={record}
                        index={index}
                        movePhoto={moveServiceRecord}
                        removePhoto={removeServiceRecord}
                        caption={captions[index] || ''}
                        onCaptionChange={onCaptionChange}
                    />
                ))}
            </div>
        </div>
    );
};

const DocumentGallery = ({ documents, removeDocument, captions, onCaptionChange }) => {
    return (
        <div className="mt-4 space-y-2">
            {documents.map((doc, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <div className="flex-1">
                        <span className="text-sm truncate">{doc.name}</span>
                        {/* Add caption input for documents */}
                        <input
                            type="text"
                            placeholder="Add document caption..."
                            value={captions[index] || ''}
                            onChange={(e) => onCaptionChange(index, e.target.value)}
                            className="w-full mt-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-black"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => removeDocument(index)}
                        className="text-red-500 ml-2"
                    >
                        <X size={16} />
                    </button>
                </div>
            ))}
        </div>
    );
};

// components/UploadProgressModal.jsx
const UploadProgressModal = ({ isOpen, fileCount }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4">
                <div className="flex items-center mb-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mr-3"></div>
                    <h3 className="text-lg font-semibold">Creating Your Auction</h3>
                </div>

                <div className="space-y-3">
                    <p className="text-gray-600">
                        We're uploading {fileCount} file(s) to our secure cloud storage.
                    </p>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-sm text-yellow-800">
                            ⏳ <strong>Please be patient:</strong> Large files may take several minutes to upload depending on your internet speed.
                        </p>
                    </div>

                    <p className="text-xs text-gray-500 text-center">
                        Do not close this window until the process is complete.
                    </p>
                </div>
            </div>
        </div>
    );
};

const categoryFields = {
    'ALL': [
        { name: 'registration', label: 'Registration Number', type: 'text', required: false, placeholder: 'e.g., AB12 CDE' },
        { name: 'miles', label: 'Miles', type: 'number', required: false, min: 0, placeholder: 'e.g., 15000' },
        { name: 'year', label: 'Year', type: 'number', required: true, min: 1900, max: new Date().getFullYear() + 1 },
        { name: 'bodyType', label: 'Body Type', type: 'select', required: false, options: ['Hatchback', 'Saloon', 'SUV', 'Estate', 'Coupe', 'Convertible', 'MPV', 'Van'] },
        { name: 'transmission', label: 'Transmission', type: 'select', required: false, options: ['Manual', 'Automatic', 'Dual-Clutch', 'CVT', 'Semi-Automatic'] },
        { name: 'fuelType', label: 'Fuel Type', type: 'select', required: false, options: ['Petrol', 'Diesel', 'Hybrid', 'Electric'] },
        { name: 'colour', label: 'Colour', type: 'text', required: false, placeholder: 'e.g., Red, Blue, Black' },
        { name: 'keys', label: 'Keys', type: 'number', required: false, min: 1, max: 4 },
        { name: 'motExpiry', label: 'MOT Expiry Date', type: 'date', required: false },
        { name: 'serviceHistory', label: 'Service History', type: 'select', required: false, options: ['Full Service', 'Part Service', 'No History'] },
        { name: 'insuranceCategory', label: 'Insurance Category', type: 'select', required: false, options: ['No Cat', 'CAT D', 'CAT S', 'CAT N'] },
        { name: 'v5Status', label: 'V5 Status', type: 'select', required: false, options: ['V5 Present', 'Scanned Copy', 'Applied For', 'Not Available'] },
        { name: 'previousOwners', label: 'Previous Owners', type: 'number', required: false, min: 0 },
        { name: 'vatStatus', label: 'VAT Status', type: 'select', required: false, options: ['Marginal', 'Qualifying', 'Commercial'] },
        { name: 'euroStatus', label: 'Euro Status', type: 'text', required: false, placeholder: 'e.g., EURO 6' },
        { name: 'capClean', label: 'CAP Clean (£)', type: 'number', required: false, min: 0, placeholder: 'e.g., 15500' },
        { name: 'vendor', label: 'Vendor', type: 'text', required: false, placeholder: 'e.g., City Motors' },
    ]
};

const CreateAuction = () => {
    const [step, setStep] = useState(1);
    const [uploadedPhotos, setUploadedPhotos] = useState([]);
    const [uploadedDocuments, setUploadedDocuments] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [categories, setCategories] = useState([]);
    const navigate = useNavigate();
    const [uploadedServiceRecords, setUploadedServiceRecords] = useState([]);
    const [showLookupModal, setShowLookupModal] = useState(false);
    const [photoCaptions, setPhotoCaptions] = useState([]);
    const [serviceRecordCaptions, setServiceRecordCaptions] = useState([]);
    const [documentCaptions, setDocumentCaptions] = useState([]);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        setError,
        clearErrors,
        trigger,
        getValues,
        reset,
        control,
        formState: { errors }
    } = useForm({
        mode: 'onChange',
        defaultValues: {
            auctionType: 'buy_now',
            categories: [],
        }
    });

    const auctionType = watch('auctionType');
    const startDate = watch('startDate');
    const endDate = watch('endDate');
    const selectedCategory = watch('category');

    // Fetch categories on component mount
    useEffect(() => {
        fetchCategories();
    }, []);

    // api request to dvla
    const handleVehicleFound = (vehicleData) => {
        // Auto-fill the vehicle title
        // if (vehicleData.title) {
        //     setValue('title', vehicleData.title);
        // }

        // Auto-fill the specifications fields that match your categoryFields
        if (vehicleData.specifications) {
            Object.keys(vehicleData.specifications).forEach((key) => {
                // Only set values for fields that exist in your categoryFields
                const fieldExists = categoryFields['ALL'].some(field => field.name === key);

                if (fieldExists && vehicleData.specifications[key] !== undefined && vehicleData.specifications[key] !== '') {
                    setValue(`specifications.${key}`, vehicleData.specifications[key]);
                }
            });
        }

        // Show success message
        toast.success('Vehicle details auto-filled successfully!');
    };

    const fetchCategories = async () => {
        try {
            setLoadingCategories(true);
            const response = await axiosInstance.get('/api/v1/admin/categories/public/active');

            if (response.data.success) {
                // Filter out "Explore" category and get active categories
                const apiCategories = response.data.data.filter(cat =>
                    !cat.isExplore && cat.name && cat.slug
                );

                // Map to the format we need
                const formattedCategories = apiCategories.map(cat => ({
                    name: cat.name,
                    slug: cat.slug,
                    id: cat.slug // Use slug as identifier
                }));

                setCategories(formattedCategories);

                // If there's only one category, pre-select it
                if (formattedCategories.length === 1) {
                    setValue('category', formattedCategories[0].slug);
                }
            } else {
                // Fallback to static categories if API fails
                setCategories(getStaticCategories());
            }
        } catch (err) {
            console.error('Error fetching categories:', err);
            // Fallback to static categories
            setCategories(getStaticCategories());
        } finally {
            setLoadingCategories(false);
        }
    };

    // Static categories fallback (optional)
    const getStaticCategories = () => [
        { name: 'Sports', slug: 'sports' },
        { name: 'Convertible', slug: 'convertible' },
        { name: 'Electric', slug: 'electric' },
        { name: 'Hatchback', slug: 'hatchback' },
        { name: 'Sedan', slug: 'sedan' },
        { name: 'SUV', slug: 'suv' },
        { name: 'Classic', slug: 'classic' },
        { name: 'Luxury', slug: 'luxury' },
        { name: 'Muscle', slug: 'muscle' },
        { name: 'Off-Road', slug: 'off-road' },
        { name: 'Truck', slug: 'truck' },
        { name: 'Van', slug: 'van' },
    ];

    // Move photo function for drag and drop
    const movePhoto = (fromIndex, toIndex) => {
        const updatedPhotos = [...uploadedPhotos];
        const updatedCaptions = [...photoCaptions];

        const [movedPhoto] = updatedPhotos.splice(fromIndex, 1);
        const [movedCaption] = updatedCaptions.splice(fromIndex, 1);

        updatedPhotos.splice(toIndex, 0, movedPhoto);
        updatedCaptions.splice(toIndex, 0, movedCaption);

        setUploadedPhotos(updatedPhotos);
        setPhotoCaptions(updatedCaptions);
    };

    // Move service record function for drag and drop
    const moveServiceRecord = (fromIndex, toIndex) => {
        const updatedRecords = [...uploadedServiceRecords];
        const updatedCaptions = [...serviceRecordCaptions];

        const [movedRecord] = updatedRecords.splice(fromIndex, 1);
        const [movedCaption] = updatedCaptions.splice(fromIndex, 1);

        updatedRecords.splice(toIndex, 0, movedRecord);
        updatedCaptions.splice(toIndex, 0, movedCaption);

        setUploadedServiceRecords(updatedRecords);
        setServiceRecordCaptions(updatedCaptions);
    };

    const getCategoryFields = () => {
        const fields = categoryFields['ALL'];
        // Since categoryFields['ALL'] is now an array, just return it
        return fields;
    };

    // Render category-specific fields
    const renderCategoryFields = () => {
        const allFields = getCategoryFields();

        // Categorize fields for display
        const vehicleInfoFields = [
            'registration', 'miles', 'year', 'bodyType', 'transmission', 'fuelType', 'colour', 'euroStatus'
        ].map(name => allFields.find(f => f.name === name)).filter(Boolean);

        const extraInfoFields = [
            'keys', 'motExpiry', 'serviceHistory', 'insuranceCategory',
            'v5Status', 'previousOwners', 'vatStatus', 'capClean', 'vendor'
        ].map(name => allFields.find(f => f.name === name)).filter(Boolean);

        return (
            <div className="space-y-8 mb-6">
                {/* Vehicle Information Section */}
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <label className="text-sm font-medium text-secondary mb-4 flex items-center">
                        <Car size={20} className="mr-2" />
                        Vehicle Information *
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {vehicleInfoFields.map((field) => (
                            <div key={field.name} className="space-y-2">
                                <label htmlFor={field.name} className="block text-sm font-medium text-gray-700">
                                    {field.label} {field.required && <span className="text-red-500">*</span>}
                                </label>
                                {renderField(field)}
                                {errors.specifications?.[field.name] && (
                                    <p className="text-red-500 text-sm">{errors.specifications[field.name].message}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Extra Information Section */}
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <label className="text-sm font-medium text-secondary mb-4 flex items-center">
                        <Settings size={20} className="mr-2" />
                        Extra Information
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {extraInfoFields.map((field) => (
                            <div key={field.name} className="space-y-2">
                                <label htmlFor={field.name} className="block text-sm font-medium text-gray-700">
                                    {field.label}
                                </label>
                                {renderField(field)}
                                {errors.specifications?.[field.name] && (
                                    <p className="text-red-500 text-sm">{errors.specifications[field.name].message}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    // Add this helper function (ADD this)
    const renderField = (field) => {
        if (field.type === 'select') {
            return (
                <select
                    {...register(`specifications.${field.name}`, {
                        required: field.required ? `${field.label} is required` : false
                    })}
                    id={field.name}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                >
                    <option value="">Select {field.label}</option>
                    {field.options.map(option => (
                        <option key={option} value={option}>{option}</option>
                    ))}
                </select>
            );
        }

        if (field.type === 'date') {
            return (
                <input
                    {...register(`specifications.${field.name}`, {
                        required: field.required ? `${field.label} is required` : false,
                        validate: (value) => {
                            if (!value) return true;
                            const date = new Date(value);
                            return !isNaN(date.getTime()) || 'Invalid date';
                        }
                    })}
                    id={field.name}
                    type="date"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
            );
        }

        if (field.type === 'number') {
            return (
                <input
                    {...register(`specifications.${field.name}`, {
                        required: field.required ? `${field.label} is required` : false,
                        min: field.min ? {
                            value: field.min,
                            message: `Must be at least ${field.min}`
                        } : undefined,
                        max: field.max ? {
                            value: field.max,
                            message: `Must be at most ${field.max}`
                        } : undefined,
                        valueAsNumber: true
                    })}
                    id={field.name}
                    type="number"
                    placeholder={field.placeholder}
                    min={field.min}
                    max={field.max}
                    step="any"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
            );
        }

        return (
            <input
                {...register(`specifications.${field.name}`, {
                    required: field.required ? `${field.label} is required` : false
                })}
                id={field.name}
                type={field.type}
                placeholder={field.placeholder}
                className="w-full p-3 capitalize border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
        );
    };

    const nextStep = async () => {
        // Validate current step before proceeding
        let isValid = true;

        if (step === 1) {
            // Trigger validation for all fields
            const fieldsToValidate = ['title', 'category', 'description', 'startDate', 'endDate'];

            // Add all specification fields to validation (only required ones)
            const allSpecFields = getCategoryFields();
            allSpecFields.forEach(field => {
                if (field.required) {
                    fieldsToValidate.push(`specifications.${field.name}`);
                }
            });

            const overallValidationPassed = await trigger(fieldsToValidate);

            // If overall validation failed, don't proceed
            if (!overallValidationPassed) {
                isValid = false;
            }

            // Check photos are uploaded
            if (uploadedPhotos.length === 0) {
                setError('photos', {
                    type: 'manual',
                    message: 'At least one photo is required'
                });
                isValid = false;
            } else {
                clearErrors('photos');
            }
        }

        if (step === 2) {
            // Check pricing fields based on auction type
            const fieldsToValidate = ['auctionType'];

            if (auctionType === 'standard' || auctionType === 'reserve') {
                fieldsToValidate.push('startPrice', 'bidIncrement');
            }

            if (auctionType === 'reserve') {
                fieldsToValidate.push('reservePrice');
            }

            if (auctionType === 'buy_now') {
                fieldsToValidate.push('buyNowPrice');
                // For buy now auctions, startPrice is also required
                fieldsToValidate.push('startPrice');
            }

            const overallValidationPassed = await trigger(fieldsToValidate);

            // If overall validation failed, don't proceed
            if (!overallValidationPassed) {
                isValid = false;
            }
        }

        if (!isValid) {
            return;
        }

        setStep(step + 1);
    };

    const prevStep = () => {
        setStep(step - 1);
    };

    const handlePhotoUpload = (e) => {
        const files = Array.from(e.target.files);
        setUploadedPhotos([...files, ...uploadedPhotos]);
        // Initialize captions for new photos
        const newCaptions = [...photoCaptions];
        files.forEach(() => newCaptions.unshift('')); // Add empty captions for new photos
        setPhotoCaptions(newCaptions);
        clearErrors('photos');
    };

    const handleCaptionChange = (index, value) => {
        const newCaptions = [...photoCaptions];
        newCaptions[index] = value;
        setPhotoCaptions(newCaptions);
    };

    const handleServiceRecordCaptionChange = (index, value) => {
        const newCaptions = [...serviceRecordCaptions];
        newCaptions[index] = value;
        setServiceRecordCaptions(newCaptions);
    };

    const handleDocumentCaptionChange = (index, value) => {
        const newCaptions = [...documentCaptions];
        newCaptions[index] = value;
        setDocumentCaptions(newCaptions);
    };

    const handleDocumentUpload = (e) => {
        const files = Array.from(e.target.files);
        setUploadedDocuments([...uploadedDocuments, ...files]);
        // Initialize captions for new documents
        const newCaptions = [...documentCaptions];
        files.forEach(() => newCaptions.push(''));
        setDocumentCaptions(newCaptions);
    };

    const handleServiceRecordUpload = (e) => {
        const files = Array.from(e.target.files);
        setUploadedServiceRecords([...uploadedServiceRecords, ...files]);
        // Initialize captions for new records
        const newCaptions = [...serviceRecordCaptions];
        files.forEach(() => newCaptions.push(''));
        setServiceRecordCaptions(newCaptions);
    };

    const removeServiceRecord = (index) => {
        const newRecords = uploadedServiceRecords.filter((_, i) => i !== index);
        setUploadedServiceRecords(newRecords);

        // Remove corresponding caption
        const newCaptions = [...serviceRecordCaptions];
        newCaptions.splice(index, 1);
        setServiceRecordCaptions(newCaptions);
    };

    const removePhoto = (index) => {
        const newPhotos = uploadedPhotos.filter((_, i) => i !== index);
        setUploadedPhotos(newPhotos);

        // Remove corresponding caption
        const newCaptions = [...photoCaptions];
        newCaptions.splice(index, 1);
        setPhotoCaptions(newCaptions);

        if (newPhotos.length === 0) {
            setError('photos', {
                type: 'manual',
                message: 'At least one photo is required'
            });
        } else {
            clearErrors('photos');
        }
    };

    const removeDocument = (index) => {
        const newDocs = uploadedDocuments.filter((_, i) => i !== index);
        setUploadedDocuments(newDocs);

        // Remove corresponding caption
        const newCaptions = [...documentCaptions];
        newCaptions.splice(index, 1);
        setDocumentCaptions(newCaptions);
    };

    const createAuctionHandler = async (auctionData) => {
        try {
            setIsLoading(true);
            const accessToken = localStorage.getItem('accessToken');

            // Create FormData object for file uploads
            const formData = new FormData();

            // Append all text fields
            formData.append('title', auctionData.title);
            formData.append('subTitle', auctionData.subTitle || '');
            // formData.append('category', auctionData.category);
            // Append categories as array
            if (auctionData.categories) {
                // If it's already an array, send each item
                if (Array.isArray(auctionData.categories)) {
                    auctionData.categories.forEach(cat => {
                        formData.append('categories', cat);
                    });
                } else {
                    // If single value, still send as array
                    formData.append('categories', auctionData.categories);
                }
            }
            formData.append('description', auctionData.description);
            formData.append('location', auctionData.location || '');
            formData.append('videoLink', auctionData.video || '');
            formData.append('auctionType', auctionData.auctionType);
            formData.append('allowOffers', auctionData.allowOffers || false);
            formData.append('features', auctionData.features || '');
            formData.append('startDate', new Date(auctionData.startDate).toISOString());
            formData.append('endDate', new Date(auctionData.endDate).toISOString());

            // Append specifications as JSON
            if (auctionData.specifications) {
                formData.append('specifications', JSON.stringify(auctionData.specifications));
            }

            // Append start price and bid increment for standard/reserve auctions
            if (auctionData.auctionType === 'standard' || auctionData.auctionType === 'reserve') {
                formData.append('startPrice', auctionData.startPrice);
                formData.append('bidIncrement', auctionData.bidIncrement);
            }

            // Append start price for buy now auctions (as it's required in your model)
            if (auctionData.auctionType === 'buy_now' && auctionData.startPrice) {
                formData.append('startPrice', auctionData.startPrice);
            }

            // Append reserve price if applicable
            if (auctionData.auctionType === 'reserve' && auctionData.reservePrice) {
                formData.append('reservePrice', auctionData.reservePrice);
            }

            // Append buy now price if applicable
            if (auctionData.auctionType === 'buy_now' && auctionData.buyNowPrice) {
                formData.append('buyNowPrice', auctionData.buyNowPrice);
            }

            // Append photos as files (in the order they appear in the array)
            uploadedPhotos.forEach((photo, index) => {
                formData.append('photos', photo);
                // Add caption if exists
                if (photoCaptions[index]) {
                    formData.append(`photoCaptions[${index}]`, photoCaptions[index]);
                }
            });

            // Append documents as files
            uploadedDocuments.forEach((doc, index) => {
                formData.append('documents', doc);
                if (documentCaptions[index]) {
                    formData.append(`documentCaptions[${index}]`, documentCaptions[index]);
                }
            });

            // Append service record images as files
            uploadedServiceRecords.forEach((record, index) => {
                formData.append('serviceRecords', record);
                if (serviceRecordCaptions[index]) {
                    formData.append(`serviceRecordCaptions[${index}]`, serviceRecordCaptions[index]);
                }
            });

            const { data } = await axiosInstance.post(
                '/api/v1/auctions/create',
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    }
                }
            );

            if (data && data.success) {
                toast.success(data.message);
                setStep(1);
                setUploadedPhotos([]);
                setUploadedDocuments([]);
                reset();
                navigate('/admin/auctions/all');
            }
        } catch (error) {
            const errorMessage = error?.response?.data?.message || 'Failed to create auction';
            toast.error(errorMessage);
            console.log('Create auction error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <DndProvider backend={HTML5Backend}>
            <section className="flex min-h-[70vh]">
                <AdminSidebar />
                <UploadProgressModal
                    isOpen={isLoading}
                    fileCount={uploadedPhotos.length + uploadedDocuments.length}
                />

                <div className="w-full relative">
                    <AdminHeader />

                    <AdminContainer>
                        <div className="pt-16 md:py-7">
                            <h1 className="text-3xl md:text-4xl font-bold mb-5">Create Car Auction</h1>
                            {/* <p className="text-secondary mb-8">List your vehicle for bidding on our platform</p> */}

                            {/* Progress Steps */}
                            <div className="mb-8">
                                <div className="flex items-center justify-between mb-4">
                                    {['Vehicle Info', 'Pricing & Bidding', 'Review & Submit'].map((label, index) => (
                                        <div key={index} className="flex flex-col items-center">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step > index + 1 ? 'bg-green-500 text-white' :
                                                step === index + 1 ? 'bg-[#1e2d3b] text-white' : 'bg-gray-200 text-gray-600'
                                                }`}>
                                                {step > index + 1 ? <CheckCircle size={20} /> : index + 1}
                                            </div>
                                            <span className="text-sm mt-2 hidden md:block">{label}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="w-full bg-gray-200 h-3 rounded-full">
                                    <div
                                        className="bg-[#1e2d3b] h-3 rounded-full transition-all duration-300"
                                        style={{ width: `${(step / 3) * 100}%` }}
                                    ></div>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit(createAuctionHandler)} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                                {/* Step 1: Vehicle Information */}
                                {step === 1 && (
                                    <div>
                                        <h2 className="text-xl font-semibold mb-6 flex items-center">
                                            <Car size={20} className="mr-2" />
                                            Vehicle Information
                                        </h2>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                            <div>
                                                <label htmlFor="title" className="block text-sm font-medium text-secondary mb-1">Vehicle Name *</label>
                                                <input
                                                    {...register('title', { required: 'Vehicle name is required' })}
                                                    id="title"
                                                    type="text"
                                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                                    placeholder="e.g., 2020 Porsche 911 Carrera S"
                                                />
                                                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
                                            </div>

                                            <div>
                                                <label htmlFor="subTitle" className="block text-sm font-medium text-secondary mb-1">Sub Title</label>
                                                <input
                                                    {...register('subTitle')}
                                                    id="subTitle"
                                                    type="text"
                                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                                    placeholder="e.g., Sunroof, Automatic, Heated Seats"
                                                />
                                                {errors.subTitle && <p className="text-red-500 text-sm mt-1">{errors.subTitle.message}</p>}
                                            </div>

                                            <div>
                                                <label htmlFor="categories" className="block text-sm font-medium text-secondary mb-1">
                                                    Categories *
                                                </label>
                                                <select
                                                    {...register('categories', {
                                                        required: 'At least one category is required',
                                                        validate: value => {
                                                            if (!value || (Array.isArray(value) && value.length === 0)) {
                                                                return 'Please select at least one category';
                                                            }
                                                            return true;
                                                        }
                                                    })}
                                                    id="categories"
                                                    multiple
                                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                                    size={Math.min(6, categories.length + 1)} // Show up to 6 items
                                                    onChange={(e) => {
                                                        const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                                                        setValue('categories', selectedOptions, { shouldValidate: true });
                                                    }}
                                                >
                                                    <option value="" disabled>Select categories (hold Ctrl/Cmd to select multiple)</option>
                                                    {categories.map(cat => (
                                                        <option
                                                            key={cat.slug}
                                                            value={cat.slug}
                                                            selected={watch('categories')?.includes(cat.slug)}
                                                        >
                                                            {cat.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                {errors.categories && <p className="text-red-500 text-sm mt-1">{errors.categories.message}</p>}

                                                {/* Show selected categories as badges */}
                                                {watch('categories')?.length > 0 && (
                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                        {watch('categories').map((catSlug, index) => {
                                                            const cat = categories.find(c => c.slug === catSlug);
                                                            return cat ? (
                                                                <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                                                    {cat.name}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const updated = watch('categories').filter(c => c !== catSlug);
                                                                            setValue('categories', updated, { shouldValidate: true });
                                                                        }}
                                                                        className="ml-1 text-red-500 hover:text-red-700"
                                                                    >
                                                                        ×
                                                                    </button>
                                                                </span>
                                                            ) : null;
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Vehicle Lookup Feature */}
                                        <div className="mb-6">
                                            <label className="block text-sm font-medium text-secondary mb-3">Quick Vehicle Lookup</label>
                                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm text-gray-700">
                                                            Enter UK registration number to auto-fill vehicle details
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Saves time by pre-filling make, model, year, colour, and fuel type
                                                        </p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowLookupModal(true)}
                                                        className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 font-medium transition-colors whitespace-nowrap"
                                                    >
                                                        <Search size={16} />
                                                        Lookup Vehicle
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Category-specific fields */}
                                        {renderCategoryFields()}

                                        {/* Features & Options */}
                                        {/* <div className="mb-6">
                                            <label className="block text-sm font-medium text-secondary mb-1">
                                                Features & Options
                                            </label>
                                            <RTE
                                                name="features"
                                                control={control}
                                                label="Features:"
                                                defaultValue={getValues('features') || ''}
                                                placeholder="List all features, options, and special equipment..."
                                            />
                                        </div> */}

                                        <div className="mb-6">
                                            <label htmlFor="description" className="block text-sm font-medium text-secondary mb-1">Description *</label>
                                            <RTE
                                                name="description"
                                                control={control}
                                                label="Description:"
                                                defaultValue={getValues('description') || ''}
                                                placeholder="Describe the vehicle's history, condition, and any notable details..."
                                            />
                                            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                            <div>
                                                <label htmlFor="location" className="block text-sm font-medium text-secondary mb-1">Location</label>
                                                <div className="relative">
                                                    <MapPin size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                                    <input
                                                        {...register('location')}
                                                        id="location"
                                                        type="text"
                                                        className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                                        placeholder="e.g., Los Angeles, California"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label htmlFor="video" className="block text-sm font-medium text-secondary mb-1">Video Link</label>
                                                <div className="relative">
                                                    <Youtube size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                                    <input
                                                        {...register('video', {
                                                            pattern: {
                                                                value: /^(https?\:\/\/)?(www\.youtube\.com|youtu\.?be)\/.+$/,
                                                                message: 'Please enter a valid YouTube URL'
                                                            }
                                                        })}
                                                        id="video"
                                                        type="url"
                                                        className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                                        placeholder="YouTube video URL (walkaround, test drive)"
                                                    />
                                                </div>
                                                {errors.video && <p className="text-red-500 text-sm mt-1">{errors.video.message}</p>}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                            <div>
                                                <label htmlFor="startDate" className="block text-sm font-medium text-secondary mb-1">Start Date & Time *</label>
                                                <div className="relative">
                                                    <Clock size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                                    <input
                                                        {...register('startDate', { required: 'Start date is required' })}
                                                        id="startDate"
                                                        type="datetime-local"
                                                        className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                                    />
                                                </div>
                                                {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate.message}</p>}
                                            </div>

                                            <div>
                                                <label htmlFor="endDate" className="block text-sm font-medium text-secondary mb-1">End Date & Time *</label>
                                                <div className="relative">
                                                    <Clock size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                                    <input
                                                        {...register('endDate', {
                                                            required: 'End date is required',
                                                            validate: {
                                                                afterStartDate: value => {
                                                                    const start = new Date(watch('startDate'));
                                                                    const end = new Date(value);
                                                                    return end > start || 'End date must be after start date';
                                                                }
                                                            }
                                                        })}
                                                        id="endDate"
                                                        type="datetime-local"
                                                        className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                                    />
                                                </div>
                                                {errors.endDate && <p className="text-red-500 text-sm mt-1">{errors.endDate.message}</p>}
                                            </div>
                                        </div>

                                        <div className="mb-6">
                                            <label htmlFor="photo-upload" className="block text-sm font-medium text-secondary mb-1">Attach Photos *</label>
                                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                                <input
                                                    type="file"
                                                    multiple
                                                    accept="image/*"
                                                    onChange={handlePhotoUpload}
                                                    className="hidden"
                                                    id="photo-upload"
                                                />
                                                <label htmlFor="photo-upload" className="cursor-pointer">
                                                    <Image size={40} className="mx-auto text-gray-400 mb-2" />
                                                    <p className="text-gray-600">Browse photo(s) to upload</p>
                                                    <p className="text-sm text-secondary">Recommended: exterior, interior, engine, undercarriage, wheels</p>
                                                </label>
                                            </div>
                                            {errors.photos && <p className="text-red-500 text-sm mt-1">{errors.photos.message}</p>}

                                            {uploadedPhotos.length > 0 && (
                                                <PhotoGallery
                                                    photos={uploadedPhotos}
                                                    movePhoto={movePhoto}
                                                    removePhoto={removePhoto}
                                                    captions={photoCaptions}
                                                    onCaptionChange={handleCaptionChange}
                                                />
                                            )}
                                        </div>

                                        <div className="mb-6">
                                            <label htmlFor="document-upload" className="block text-sm font-medium text-secondary mb-1">Attach Documents</label>
                                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                                <input
                                                    type="file"
                                                    multiple
                                                    onChange={handleDocumentUpload}
                                                    className="hidden"
                                                    id="document-upload"
                                                />
                                                <label htmlFor="document-upload" className="cursor-pointer">
                                                    <File size={40} className="mx-auto text-gray-400 mb-2" />
                                                    <p className="text-gray-600">Browse document(s) to upload</p>
                                                    <p className="text-sm text-secondary">Title, registration, maintenance records, ownership docs, etc.</p>
                                                </label>
                                            </div>

                                            {/* {uploadedDocuments.length > 0 && (
                                                <div className="mt-4 space-y-2">
                                                    {uploadedDocuments.map((doc, index) => (
                                                        <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                                                            <span className="text-sm truncate">{doc.name}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeDocument(index)}
                                                                className="text-red-500"
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )} */}

                                            {uploadedDocuments.length > 0 && (
                                                <DocumentGallery
                                                    documents={uploadedDocuments}
                                                    removeDocument={removeDocument}
                                                    captions={documentCaptions}
                                                    onCaptionChange={handleDocumentCaptionChange}
                                                />
                                            )}
                                        </div>

                                        <div className="mb-6">
                                            <label htmlFor="service-upload" className="block text-sm font-medium text-secondary mb-1">
                                                Service History Images *
                                            </label>
                                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                                <input
                                                    type="file"
                                                    multiple
                                                    accept="image/*"
                                                    onChange={handleServiceRecordUpload}
                                                    className="hidden"
                                                    id="service-upload"
                                                />
                                                <label htmlFor="service-upload" className="cursor-pointer">
                                                    <FileText size={40} className="mx-auto text-gray-400 mb-2" />
                                                    <p className="text-gray-600">Browse service record image(s) to upload</p>
                                                    <p className="text-sm text-secondary">Service invoices, maintenance records, repair receipts, etc.</p>
                                                </label>
                                            </div>

                                            {uploadedServiceRecords.length > 0 && (
                                                <ServiceHistoryGallery
                                                    serviceRecords={uploadedServiceRecords}
                                                    moveServiceRecord={moveServiceRecord}
                                                    removeServiceRecord={removeServiceRecord}
                                                    captions={serviceRecordCaptions}
                                                    onCaptionChange={handleServiceRecordCaptionChange}
                                                />
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Step 2: Pricing & Bidding */}
                                {step === 2 && (
                                    <div>
                                        <h2 className="text-xl font-semibold mb-6 flex items-center">
                                            <PoundSterling size={20} className="mr-2" />
                                            Pricing & Bidding
                                        </h2>

                                        <div className="mb-6">
                                            <label className="block text-sm font-medium text-secondary mb-1">Auction Type *</label>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                {[
                                                    { value: 'standard', label: 'Standard Auction' },
                                                    { value: 'reserve', label: 'Reserve Price Auction' },
                                                    { value: 'buy_now', label: 'Buy Now Auction' },
                                                ].map((type) => (
                                                    <label key={type.value} className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                                                        <input
                                                            type="radio"
                                                            {...register('auctionType', { required: 'Auction type is required' })}
                                                            value={type.value}
                                                            className="mr-3"
                                                        />
                                                        <span>{type.label}</span>
                                                    </label>
                                                ))}
                                            </div>
                                            {errors.auctionType && <p className="text-red-500 text-sm mt-1">{errors.auctionType.message}</p>}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                            <div>
                                                <label htmlFor="startPrice" className="block text-sm font-medium text-secondary mb-1">Start Price *</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600">£</span>
                                                    <input
                                                        {...register('startPrice', {
                                                            required: 'Start price is required',
                                                            min: { value: 0, message: 'Price must be positive' }
                                                        })}
                                                        id="startPrice"
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        className="w-full pl-8 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                                {errors.startPrice && <p className="text-red-500 text-sm mt-1">{errors.startPrice.message}</p>}
                                            </div>

                                            {
                                                (auctionType === 'standard' || auctionType === 'reserve') && (
                                                    <div>
                                                        <label htmlFor="bidIncrement" className="block text-sm font-medium text-secondary mb-1">Bid Increment *</label>
                                                        <div className="relative">
                                                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600">£</span>
                                                            <input
                                                                {...register('bidIncrement', {
                                                                    required: 'Bid increment is required',
                                                                    min: { value: 0, message: 'Increment must be positive' }
                                                                })}
                                                                id="bidIncrement"
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                className="w-full pl-8 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                                                placeholder="0.00"
                                                            />
                                                        </div>
                                                        {errors.bidIncrement && <p className="text-red-500 text-sm mt-1">{errors.bidIncrement.message}</p>}
                                                    </div>
                                                )
                                            }
                                        </div>

                                        {auctionType === 'reserve' && (
                                            <div className="mb-6">
                                                <label htmlFor="reservePrice" className="block text-sm font-medium text-secondary mb-1">Reserve Price *</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600">£</span>
                                                    <input
                                                        {...register('reservePrice', {
                                                            required: auctionType === 'reserve' ? 'Reserve price is required' : false,
                                                            min: { value: 0, message: 'Price must be positive' },
                                                            validate: value => {
                                                                const startPrice = parseFloat(watch('startPrice') || 0);
                                                                const reservePrice = parseFloat(value);
                                                                return reservePrice >= startPrice || 'Reserve price must be greater than or equal to start price';
                                                            }
                                                        })}
                                                        id="reservePrice"
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        className="w-full pl-8 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                                {errors.reservePrice && <p className="text-red-500 text-sm mt-1">{errors.reservePrice.message}</p>}
                                                <p className="text-sm text-secondary mt-1">Vehicle will not sell if bids don't reach this price</p>
                                            </div>
                                        )}

                                        {/* Buy Now Price (for buy_now auction type) */}
                                        {auctionType === 'buy_now' && (
                                            <>
                                                <div className="mb-4">
                                                    <label htmlFor="buyNowPrice" className="block text-sm font-medium text-secondary mb-1">
                                                        Buy Now Price *
                                                    </label>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600">£</span>
                                                        <input
                                                            {...register('buyNowPrice', {
                                                                required: auctionType === 'buy_now' ? 'Buy Now price is required' : false,
                                                                min: { value: 0, message: 'Price must be positive' },
                                                                validate: value => {
                                                                    const startPrice = parseFloat(watch('startPrice') || 0);
                                                                    const buyNowPrice = parseFloat(value);
                                                                    return buyNowPrice >= startPrice || 'Buy Now price must be greater than or equal to start price';
                                                                }
                                                            })}
                                                            id="buyNowPrice"
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            className="w-full pl-8 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                                            placeholder="0.00"
                                                        />
                                                    </div>
                                                    {errors.buyNowPrice && <p className="text-red-500 text-sm mt-1">{errors.buyNowPrice.message}</p>}
                                                    <p className="text-sm text-secondary mt-1">
                                                        Buyers can purchase immediately at this price, ending the auction
                                                    </p>
                                                </div>
                                            </>
                                        )}

                                        {/* Allow Offers Toggle */}
                                        <div className="mb-6">
                                            <label className="flex items-center cursor-pointer">
                                                <div className="relative">
                                                    <input
                                                        type="checkbox"
                                                        {...register('allowOffers')}
                                                        id="allowOffers"
                                                        className="sr-only"
                                                    />
                                                    <div className={`block w-14 h-8 rounded-full ${watch('allowOffers') ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                                    <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition ${watch('allowOffers') ? 'transform translate-x-6' : ''}`}></div>
                                                </div>
                                                <div className="ml-3">
                                                    <span className="font-medium text-secondary">Allow Offers</span>
                                                    <p className="text-sm text-secondary mt-1">
                                                        Enable buyers to make purchase offers during the auction
                                                    </p>
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                )}

                                {/* Step 3: Review & Submit */}
                                {step === 3 && (
                                    <div>
                                        <h2 className="text-xl font-semibold mb-6 flex items-center">
                                            <Settings size={20} className="mr-2" />
                                            Review & Submit
                                        </h2>

                                        <div className="bg-gray-50 p-6 rounded-lg mb-6 border border-gray-200">
                                            <h3 className="font-medium text-lg mb-4 border-b pb-2">Auction Summary</h3>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {/* Vehicle Details */}
                                                <div className="space-y-4">
                                                    <div className="bg-white p-4 rounded-lg shadow-sm">
                                                        <h4 className="font-medium mb-3">Vehicle Details</h4>
                                                        <div className="space-y-2">
                                                            <div>
                                                                <p className="text-xs text-secondary">Vehicle Name</p>
                                                                <p className="font-medium">{watch('title') || 'Not provided'}</p>
                                                            </div>
                                                            {watch('subTitle') && (
                                                                <div>
                                                                    <p className="text-xs text-secondary">Sub Title</p>
                                                                    <p className="font-medium">{watch('subTitle')}</p>
                                                                </div>
                                                            )}
                                                            <div>
                                                                <p className="text-xs text-secondary">Category</p>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {watch('categories')?.map((catSlug, index) => {
                                                                        const cat = categories.find(c => c.slug === catSlug);
                                                                        return cat ? (
                                                                            <span key={index} className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                                                                                {cat.name}
                                                                            </span>
                                                                        ) : null;
                                                                    })}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-secondary">Location</p>
                                                                <p className="font-medium">{watch('location') || 'Not specified'}</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {selectedCategory && (
                                                        <div className="space-y-4">
                                                            {/* Vehicle Information Review */}
                                                            <div className="bg-white p-4 rounded-lg shadow-sm">
                                                                <h4 className="font-medium mb-3">Vehicle Information</h4>
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    {['registration', 'miles', 'year', 'bodyType', 'transmission', 'fuelType', 'colour'].map((fieldName) => {
                                                                        const field = getCategoryFields().find(f => f.name === fieldName);
                                                                        const value = watch(`specifications.${fieldName}`);
                                                                        return value ? (
                                                                            <div key={fieldName}>
                                                                                <p className="text-xs text-secondary">{field?.label}</p>
                                                                                <p className="font-medium">{value}</p>
                                                                            </div>
                                                                        ) : null;
                                                                    }).filter(Boolean)}
                                                                </div>
                                                            </div>

                                                            {/* Extra Information Review */}
                                                            <div className="bg-white p-4 rounded-lg shadow-sm">
                                                                <h4 className="font-medium mb-3">Extra Information</h4>
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    {['keys', 'motExpiry', 'serviceHistory', 'insuranceCategory', 'v5Status', 'previousOwners', 'vatStatus', 'capClean', 'vendor'].map((fieldName) => {
                                                                        const field = getCategoryFields().find(f => f.name === fieldName);
                                                                        const value = watch(`specifications.${fieldName}`);
                                                                        return value ? (
                                                                            <div key={fieldName}>
                                                                                <p className="text-xs text-secondary">{field?.label}</p>
                                                                                <p className="font-medium">{fieldName === 'motExpiry' ? new Date(value).toLocaleDateString('en-GB') : value}</p>
                                                                            </div>
                                                                        ) : null;
                                                                    }).filter(Boolean)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Auction Details */}
                                                <div className="space-y-4">
                                                    <div className="bg-white p-4 rounded-lg shadow-sm">
                                                        <h4 className="font-medium mb-3">Auction Details</h4>
                                                        <div className="space-y-2">
                                                            <div>
                                                                <p className="text-xs text-secondary">Auction Type</p>
                                                                <p className="font-medium">
                                                                    {watch('auctionType') === 'standard' && 'Standard Auction'}
                                                                    {watch('auctionType') === 'reserve' && 'Reserve Price Auction'}
                                                                    {watch('auctionType') === 'buy_now' && 'Buy Now Auction'}
                                                                </p>
                                                            </div>
                                                            {watch('allowOffers') && (
                                                                <div>
                                                                    <p className="text-xs text-secondary">Allow Offers</p>
                                                                    <p className="font-medium text-green-600">Yes</p>
                                                                </div>
                                                            )}
                                                            <div>
                                                                <p className="text-xs text-secondary">Start Date</p>
                                                                <p className="font-medium">
                                                                    {watch('startDate') ? new Date(watch('startDate')).toLocaleString() : 'Not provided'}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-secondary">End Date</p>
                                                                <p className="font-medium">
                                                                    {watch('endDate') ? new Date(watch('endDate')).toLocaleString() : 'Not provided'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Media */}
                                                    <div className="bg-white p-4 rounded-lg shadow-sm">
                                                        <h4 className="font-medium mb-3">Media & Documents</h4>
                                                        <div className="space-y-2">
                                                            <div className="flex justify-between items-center">
                                                                <p className="text-xs text-secondary">Photos</p>
                                                                <span className="font-medium bg-gray-100 px-2 py-1 rounded-full text-xs">
                                                                    {uploadedPhotos.length} uploaded
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between items-center">
                                                                <p className="text-xs text-secondary">Documents</p>
                                                                <span className="font-medium bg-gray-100 px-2 py-1 rounded-full text-xs">
                                                                    {uploadedDocuments.length} uploaded
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between items-center">
                                                                <p className="text-xs text-secondary">Service Records</p>
                                                                <span className="font-medium bg-gray-100 px-2 py-1 rounded-full text-xs">
                                                                    {uploadedServiceRecords.length} uploaded
                                                                </span>
                                                            </div>
                                                            {watch('video') && (
                                                                <div className="flex justify-between items-center">
                                                                    <p className="text-xs text-secondary">Video</p>
                                                                    <span className="font-medium bg-gray-100 px-2 py-1 rounded-full text-xs">
                                                                        Included
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Pricing */}
                                                    <div className="bg-white p-4 rounded-lg shadow-sm">
                                                        <h4 className="font-medium mb-3">Pricing</h4>
                                                        <div className="space-y-2">
                                                            {(watch('auctionType') === 'standard' || watch('auctionType') === 'reserve' || watch('auctionType') === 'buy_now') && (
                                                                <div>
                                                                    <p className="text-xs text-secondary">Start Price</p>
                                                                    <p className="font-medium">£{watch('startPrice') || '0.00'}</p>
                                                                </div>
                                                            )}

                                                            {(watch('auctionType') === 'standard' || watch('auctionType') === 'reserve') && (
                                                                <div>
                                                                    <p className="text-xs text-secondary">Bid Increment</p>
                                                                    <p className="font-medium">£{watch('bidIncrement') || '0.00'}</p>
                                                                </div>
                                                            )}

                                                            {watch('auctionType') === 'reserve' && (
                                                                <div>
                                                                    <p className="text-xs text-secondary">Reserve Price</p>
                                                                    <p className="font-medium text-green-600">£{watch('reservePrice') || '0.00'}</p>
                                                                </div>
                                                            )}

                                                            {watch('auctionType') === 'buy_now' && (
                                                                <div>
                                                                    <p className="text-xs text-secondary">Buy Now Price</p>
                                                                    <p className="font-medium text-blue-600">£{watch('buyNowPrice') || '0.00'}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* {watch('features') && (
                                                <div className="bg-white p-4 rounded-lg shadow-sm mt-4">
                                                    <h4 className="font-medium text-black mb-3">Features & Options</h4>
                                                    <div className="prose prose-lg max-w-none border rounded-lg p-4 bg-gray-50">
                                                        {parse(watch('features'))}
                                                    </div>
                                                </div>
                                            )} */}

                                            {/* Description Preview */}
                                            <div className="bg-white p-4 rounded-lg shadow-sm mt-4">
                                                <h4 className="font-medium text-black mb-3">Description Preview</h4>
                                                <div className="prose prose-lg max-w-none border rounded-lg p-4 bg-gray-50">
                                                    {watch('description') ? (
                                                        parse(watch('description'))
                                                    ) : (
                                                        <p className="text-gray-500 italic">No description provided</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mb-6">
                                            <label htmlFor="termsAgreed" className="flex items-start">
                                                <input
                                                    type="checkbox"
                                                    {...register('termsAgreed', { required: 'You must agree to the terms' })}
                                                    id="termsAgreed"
                                                    className="mt-1 mr-2"
                                                />
                                                <span className="text-sm font-medium text-secondary">
                                                    I agree to the terms and conditions and confirm that I have the right to sell this vehicle
                                                </span>
                                            </label>
                                            {errors.termsAgreed && <p className="text-red-500 text-sm mt-1">{errors.termsAgreed.message}</p>}
                                        </div>
                                    </div>
                                )}

                                {/* Navigation Buttons */}
                                <div className="flex justify-between mt-8">
                                    {step > 1 ? (
                                        <button
                                            type="button"
                                            onClick={prevStep}
                                            className="flex items-center px-6 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                                        >
                                            <ArrowLeft size={18} className="mr-2" />
                                            Previous
                                        </button>
                                    ) : (
                                        <div></div>
                                    )}

                                    {step < 3 ? (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                nextStep();
                                            }}
                                            className="flex items-center px-6 py-2 bg-[#edcd1f] text-black rounded-lg hover:bg-[#edcd1f]/90 transition-colors"
                                        >
                                            Next
                                            <ArrowRight size={18} className="ml-2" />
                                        </button>
                                    ) : (
                                        <button
                                            type="submit"
                                            className="flex items-center px-6 py-2 bg-[#edcd1f] text-black rounded-lg hover:bg-[#edcd1f]/90 transition-colors"
                                        >
                                            <Gavel size={18} className="mr-2" />
                                            {isLoading ? 'Creating Auction...' : 'Create Auction'}
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </AdminContainer>

                    <VehicleLookupModal
                        isOpen={showLookupModal}
                        onClose={() => setShowLookupModal(false)}
                        onVehicleFound={handleVehicleFound}
                    />
                </div>
            </section>
        </DndProvider>
    );
};

export default CreateAuction;