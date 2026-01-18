import { useState, useEffect, useRef, useCallback } from 'react';
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
    Plane,
    Cog,
    Trophy,
    Move,
    Car,
    Calendar
} from "lucide-react";
import { RTE, AdminContainer, AdminHeader, AdminSidebar } from '../../components';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axiosInstance from '../../utils/axiosInstance';

// Drag and Drop item types
const ItemTypes = {
    PHOTO: 'photo',
};

// Fixed Draggable Photo Component
const DraggablePhoto = ({ photo, index, movePhoto, removePhoto, caption, onCaptionChange }) => {
    const ref = useRef(null);

    const [{ isDragging }, drag] = useDrag({
        type: ItemTypes.PHOTO,
        item: { type: ItemTypes.PHOTO, index },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    });

    const [, drop] = useDrop({
        accept: ItemTypes.PHOTO,
        hover(item, monitor) {
            if (!ref.current) {
                return;
            }
            const dragIndex = item.index;
            const hoverIndex = index;

            // Don't replace items with themselves
            if (dragIndex === hoverIndex) {
                return;
            }

            // Determine rectangle on screen
            const hoverBoundingRect = ref.current?.getBoundingClientRect();

            // Get vertical middle
            const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

            // Determine mouse position
            const clientOffset = monitor.getClientOffset();

            // Get pixels to the top
            const hoverClientY = clientOffset.y - hoverBoundingRect.top;

            // Only perform the move when the mouse has crossed half of the items height
            // When dragging downwards, only move when the cursor is below 50%
            // When dragging upwards, only move when the cursor is above 50%
            if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
                return;
            }

            // When dragging upwards, only move when the cursor is above 50%
            if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
                return;
            }

            // Time to actually perform the action
            movePhoto(dragIndex, hoverIndex);

            // Note: we're mutating the monitor item here!
            // Generally it's better to avoid mutations,
            // but it's good here for the sake of performance
            // to avoid expensive index searches.
            item.index = hoverIndex;
        },
    });

    // Use the drag and drop refs
    drag(drop(ref));

    return (
        <div className="space-y-2">
            {/* Image with drag/drop */}
            <div
                ref={ref}
                style={{
                    opacity: isDragging ? 0.5 : 1,
                    cursor: isDragging ? 'grabbing' : 'grab',
                }}
                className="relative group transition-all duration-200"
            >
                <img
                    src={photo.isExisting ? photo.url : URL.createObjectURL(photo.file)}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border-2 border-transparent hover:border-blue-500"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                    <Move size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </div>
                <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-full">
                    {index + 1}
                </div>
                <div className="absolute top-2 right-2 bg-blue-500 bg-opacity-70 text-white text-xs px-2 py-1 rounded-full">
                    {photo.isExisting ? 'Existing' : 'New'}
                </div>
                <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors z-10"
                >
                    <X size={14} />
                </button>
            </div>

            {/* Add caption input */}
            <input
                type="text"
                placeholder="Add caption..."
                value={caption || ''}
                onChange={(e) => onCaptionChange(index, e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-black"
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
                <span className="block text-xs text-gray-500 mt-1">
                    Blue badge indicates existing photos
                </span>
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {photos.map((photo, index) => (
                    <DraggablePhoto
                        key={photo.id}
                        photo={photo}
                        index={index}
                        movePhoto={movePhoto}
                        removePhoto={removePhoto}
                        caption={captions[index] || ''} // Add this
                        onCaptionChange={onCaptionChange} // Add this
                    />
                ))}
            </div>
        </div>
    );
};

// document gallery component
const DocumentGallery = ({ existingDocs, newDocs, removeDoc, existingCaptions, newCaptions, onCaptionChange }) => {
    return (
        <div className="space-y-4">
            {/* Existing documents */}
            {existingDocs.length > 0 && (
                <div>
                    <p className="text-sm text-secondary mb-2">Existing Documents:</p>
                    <div className="space-y-2">
                        {existingDocs.map((doc, index) => (
                            <div key={`existing-doc-${index}`} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                                <div className="flex-1">
                                    <span className="text-sm truncate">{doc.filename || doc.originalName}</span>
                                    <input
                                        type="text"
                                        placeholder="Add caption..."
                                        value={existingCaptions[index] || ''}
                                        onChange={(e) => onCaptionChange('existing', index, e.target.value)}
                                        className="w-full mt-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-black"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeDoc(index, true)}
                                    className="text-red-500 ml-2"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* New documents */}
            {newDocs.length > 0 && (
                <div>
                    <p className="text-sm text-secondary mb-2">New Documents:</p>
                    <div className="space-y-2">
                        {newDocs.map((doc, index) => (
                            <div key={`new-doc-${index}`} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                                <div className="flex-1">
                                    <span className="text-sm truncate">{doc.name}</span>
                                    <input
                                        type="text"
                                        placeholder="Add caption..."
                                        value={newCaptions[index] || ''}
                                        onChange={(e) => onCaptionChange('new', index, e.target.value)}
                                        className="w-full mt-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-black"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeDoc(index, false)}
                                    className="text-red-500 ml-2"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// components/UploadProgressModal.jsx
const UploadProgressModal = ({ isOpen, fileCount, isEdit = false }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4">
                <div className="flex items-center mb-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                    <h3 className="text-lg font-semibold">
                        {isEdit ? 'Updating Your Auction' : 'Creating Your Auction'}
                    </h3>
                </div>

                <div className="space-y-3">
                    <p className="text-gray-600">
                        {fileCount > 0
                            ? `We're uploading ${fileCount} file(s) to our secure cloud storage.`
                            : 'We\'re updating your auction details.'
                        }
                    </p>

                    {fileCount > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <p className="text-sm text-yellow-800">
                                ⏳ <strong>Please be patient:</strong> Large files may take several minutes to upload depending on your internet speed.
                            </p>
                        </div>
                    )}

                    <p className="text-xs text-gray-500 text-center">
                        Do not close this window until the process is complete.
                    </p>
                </div>
            </div>
        </div>
    );
};

// Category-specific field configurations
const categoryFields = {
    'ALL': [
        { name: 'registration', label: 'Registration Number', type: 'text', required: false, placeholder: 'e.g., AB12 CDE' },
        { name: 'miles', label: 'Miles', type: 'number', required: false, min: 0, placeholder: 'e.g., 15000' },
        { name: 'year', label: 'Year', type: 'number', required: true, min: 1900, max: new Date().getFullYear() + 1 },
        { name: 'bodyType', label: 'Body Type', type: 'select', required: false, options: ['Hatchback', 'Saloon', 'SUV', 'Estate', 'Coupe', 'Convertible', 'MPV'] },
        { name: 'transmission', label: 'Transmission', type: 'select', required: false, options: ['Manual', 'Automatic', 'Dual-Clutch', 'CVT', 'Semi-Automatic'] },
        { name: 'fuelType', label: 'Fuel Type', type: 'select', required: false, options: ['Gasoline', 'Diesel', 'Hybrid', 'Electric'] },
        { name: 'colour', label: 'Colour', type: 'text', required: false, placeholder: 'e.g., Red, Blue, Black' },
        { name: 'keys', label: 'Keys', type: 'number', required: false, min: 1, max: 4 },
        { name: 'motExpiry', label: 'MOT Expiry Date', type: 'date', required: false },
        { name: 'serviceHistory', label: 'Service History', type: 'select', required: false, options: ['Full Service', 'Part Service', 'No History'] },
        { name: 'insuranceCategory', label: 'Insurance Category', type: 'select', required: false, options: ['No Cat', 'CAT D', 'CAT S', 'CAT N'] },
        { name: 'v5Status', label: 'V5 Status', type: 'select', required: false, options: ['V5 Present', 'Scanned Copy', 'Applied For', 'Not Available'] },
        { name: 'previousOwners', label: 'Previous Owners', type: 'number', required: false, min: 0 },
        { name: 'vatStatus', label: 'VAT Status', type: 'select', required: false, options: ['Marginal', 'Qualifying', 'Commercial'] },
        { name: 'capClean', label: 'CAP Clean (£)', type: 'number', required: false, min: 0, placeholder: 'e.g., 15500' },
        { name: 'vendor', label: 'Vendor', type: 'text', required: false, placeholder: 'e.g., City Motors' },
    ]
};

const EditAuction = () => {
    const [step, setStep] = useState(1);
    const [allPhotos, setAllPhotos] = useState([]); // Unified photo array
    const [uploadedDocuments, setUploadedDocuments] = useState([]);
    const [existingDocuments, setExistingDocuments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [initialSpecifications, setInitialSpecifications] = useState({});
    const [removedPhotos, setRemovedPhotos] = useState([]);
    const [removedDocuments, setRemovedDocuments] = useState([]);
    const [existingServiceRecords, setExistingServiceRecords] = useState([]);
    const [uploadedServiceRecords, setUploadedServiceRecords] = useState([]);
    const [removedServiceRecords, setRemovedServiceRecords] = useState([]);
    const [allServiceRecords, setAllServiceRecords] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [categories, setCategories] = useState([]);

    // Calculate if there are new files to upload
    const newPhotos = allPhotos.filter(photo => !photo.isExisting);
    const hasNewUploads = newPhotos.length > 0 || uploadedDocuments.length > 0;
    const totalNewFiles = newPhotos.length + uploadedDocuments.length;

    // caption states
    const [photoCaptions, setPhotoCaptions] = useState([]);
    const [documentCaptions, setDocumentCaptions] = useState([]);
    const [serviceRecordCaptions, setServiceRecordCaptions] = useState([]);
    const [uploadedDocumentCaptions, setUploadedDocumentCaptions] = useState([]);

    const { auctionId } = useParams();
    const navigate = useNavigate();

    const categoryIcons = {
        'Sports': Trophy,
        'Convertible': Car,
        'Electric': Cog,
        'Hatchback': Car,
        'Sedan': Car,
        'SUV': Car,
        'Classic': Calendar
    };

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        setError,
        clearErrors,
        trigger,
        getValues,
        control,
        reset,
        formState: { errors }
    } = useForm({
        mode: 'onChange',
        defaultValues: {
            auctionType: 'buy_now',
            endDate: ''
        }
    });

    const auctionType = watch('auctionType');
    const startDate = watch('startDate');
    const endDate = watch('endDate');
    const selectedCategory = watch('category');

    // Get category-specific fields
    const getCategoryFields = () => {
        return categoryFields['ALL'] || [];
    };

    // Fetch categories on component mount
    useEffect(() => {
        fetchCategories();
    }, []);

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

    const movePhoto = useCallback((dragIndex, hoverIndex) => {
        setAllPhotos(prevPhotos => {
            const updatedPhotos = [...prevPhotos];
            const [movedPhoto] = updatedPhotos.splice(dragIndex, 1);
            updatedPhotos.splice(hoverIndex, 0, movedPhoto);
            return updatedPhotos;
        });

        // Also move corresponding captions
        setPhotoCaptions(prevCaptions => {
            const updatedCaptions = [...prevCaptions];
            const [movedCaption] = updatedCaptions.splice(dragIndex, 1);
            updatedCaptions.splice(hoverIndex, 0, movedCaption);
            return updatedCaptions;
        });
    }, []);

    const moveServiceRecord = useCallback((dragIndex, hoverIndex) => {
        setAllServiceRecords(prevServiceRecords => {
            const updatedServiceRecords = [...prevServiceRecords];
            const [movedServiceRecord] = updatedServiceRecords.splice(dragIndex, 1);
            updatedServiceRecords.splice(hoverIndex, 0, movedServiceRecord);
            return updatedServiceRecords;
        });

        // Also move corresponding captions
        setServiceRecordCaptions(prevCaptions => {
            const updatedCaptions = [...prevCaptions];
            const [movedCaption] = updatedCaptions.splice(dragIndex, 1);
            updatedCaptions.splice(hoverIndex, 0, movedCaption);
            return updatedCaptions;
        });
    }, []);

    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
        return localDate.toISOString().slice(0, 16);
    };

    const mapToObject = (map) => {
        if (!map) return {};
        if (map instanceof Map) {
            const obj = {};
            map.forEach((value, key) => {
                obj[key] = value;
            });
            return obj;
        }
        return map;
    };

    // Fetch auction data
    useEffect(() => {
        const fetchAuctionData = async () => {
            try {
                setIsLoading(true);
                const { data } = await axiosInstance.get(`/api/v1/admin/auctions/${auctionId}`);

                if (data.success) {
                    const auction = data.data.auction;
                    const specificationsObj = mapToObject(auction.specifications);
                    setInitialSpecifications(specificationsObj);

                    // Set basic fields
                    const formData = {
                        title: auction.title,
                        subTitle: auction.subTitle || '',
                        categories: auction.categories || auction.category || [],
                        features: auction.features || '',
                        description: auction.description,
                        location: auction.location,
                        video: auction.videoLink,
                        startDate: formatDateForInput(auction.startDate),
                        endDate: '',
                        startPrice: auction.startPrice,
                        bidIncrement: auction.bidIncrement,
                        auctionType: auction.auctionType,
                        reservePrice: auction.reservePrice,
                        buyNowPrice: auction.buyNowPrice, // Add this
                        allowOffers: auction.allowOffers // Add this
                    };
                    reset(formData);

                    setTimeout(() => {
                        Object.entries(specificationsObj).forEach(([key, value]) => {
                            setValue(`specifications.${key}`, value, {
                                shouldValidate: true,
                                shouldDirty: false,
                                shouldTouch: false
                            });
                        });
                    }, 100);

                    // Initialize allPhotos with existing photos marked as existing
                    const existingPhotosWithFlag = (auction.photos || []).map(photo => ({
                        ...photo,
                        isExisting: true,
                        id: photo.publicId || photo._id
                    }));
                    setAllPhotos(existingPhotosWithFlag);

                    setExistingDocuments(auction.documents || []);

                    // setExistingServiceRecords(auction.ServiceRecords || []);
                    // Replace existing logbook initialization with:
                    const existingServiceRecordsWithFlag = (auction.serviceRecords || []).map(serviceRecord => ({
                        ...serviceRecord,
                        isExisting: true,
                        id: serviceRecord.publicId || serviceRecord._id
                    }));
                    setAllServiceRecords(existingServiceRecordsWithFlag);

                    // Initialize photo captions
                    const initialPhotoCaptions = (auction.photos || []).map(photo => photo.caption || '');
                    setPhotoCaptions(initialPhotoCaptions);

                    // Initialize document captions
                    const initialDocCaptions = (auction.documents || []).map(doc => doc.caption || '');
                    setDocumentCaptions(initialDocCaptions);

                    // Initialize service record captions
                    const initialServiceRecordCaptions = (auction.serviceRecords || []).map(record => record.caption || '');
                    setServiceRecordCaptions(initialServiceRecordCaptions);

                    toast.success('Auction data loaded successfully');
                }
            } catch (error) {
                console.error('Error:', error);
                toast.error('Failed to load auction data');
                navigate('/admin/auctions');
            } finally {
                setIsLoading(false);
            }
        };

        if (auctionId) fetchAuctionData();
    }, [auctionId, reset, setValue, navigate]);

    const renderCategoryFields = () => {
        const allFields = getCategoryFields();

        // Categorize fields for display
        const vehicleInfoFields = [
            'registration', 'miles', 'year', 'bodyType', 'transmission', 'fuelType', 'colour'
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

    // Add this helper function (ADD this after renderCategoryFields)
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
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
        );
    };

    const nextStep = async () => {
        let isValid = true;

        if (step === 1) {
            const fieldsToValidate = ['title', 'category', 'description', 'startDate', 'endDate'];

            // Add category-specific fields to validation
            // Add ALL specification fields to validation
            const allSpecFields = getCategoryFields();
            allSpecFields.forEach(field => {
                if (field.required) {
                    fieldsToValidate.push(`specifications.${field.name}`);
                }
            });

            const overallValidationPassed = await trigger(fieldsToValidate);

            if (!overallValidationPassed) {
                isValid = false;
            }

            // Check photos are uploaded or exist
            if (allPhotos.length === 0) {
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

    // Fixed handlePhotoUpload function
    const handlePhotoUpload = (e) => {
        const files = Array.from(e.target.files);

        if (files.length === 0) return;

        // Generate consistent IDs using file properties and timestamp
        const newPhotos = files.map(file => {
            // Create a more stable ID using file properties
            const fileId = `${file.name}-${file.size}-${file.lastModified}`;
            const uniqueId = `new-${Date.now()}-${fileId.replace(/[^a-zA-Z0-9]/g, '-')}`;

            return {
                file,
                isExisting: false,
                id: uniqueId,
                // Add a unique identifier to prevent duplicates
                _fileSignature: `${file.name}-${file.size}-${file.lastModified}`
            };
        });

        // Filter out duplicates based on file signature
        const existingSignatures = new Set(
            allPhotos
                .filter(photo => !photo.isExisting)
                .map(photo => photo._fileSignature)
        );

        const uniqueNewPhotos = newPhotos.filter(photo =>
            !existingSignatures.has(photo._fileSignature)
        );

        if (uniqueNewPhotos.length === 0) {
            toast.error('Some photos are already added');
            return;
        }

        setAllPhotos(prev => {
            // Remove any potential duplicates from previous state
            const existingSignatures = new Set(
                prev.filter(p => !p.isExisting).map(p => p._fileSignature)
            );

            const filteredNewPhotos = uniqueNewPhotos.filter(photo =>
                !existingSignatures.has(photo._fileSignature)
            );

            return [...filteredNewPhotos, ...prev];
        });

        // Initialize captions for new photos
        const newCaptions = [...photoCaptions];
        files.forEach(() => newCaptions.unshift('')); // Add empty captions at beginning
        setPhotoCaptions(newCaptions);

        clearErrors('photos');

        // Reset the file input
        e.target.value = '';
    };

    const handleServiceRecordUpload = (e) => {
        const files = Array.from(e.target.files);

        if (files.length === 0) return;

        const newServiceRecords = files.map(file => {
            const fileId = `${file.name}-${file.size}-${file.lastModified}`;
            const uniqueId = `new-servicerecord-${Date.now()}-${fileId.replace(/[^a-zA-Z0-9]/g, '-')}`;

            return {
                file,
                isExisting: false,
                id: uniqueId,
                _fileSignature: `${file.name}-${file.size}-${file.lastModified}`
            };
        });

        const existingSignatures = new Set(
            allServiceRecords
                .filter(serviceRecord => !serviceRecord.isExisting)
                .map(serviceRecord => serviceRecord._fileSignature)
        );

        const uniqueNewServiceRecords = newServiceRecords.filter(serviceRecord =>
            !existingSignatures.has(serviceRecord._fileSignature)
        );

        if (uniqueNewServiceRecords.length === 0) {
            toast.error('Some serviceRecord images are already added');
            return;
        }

        setAllServiceRecords(prev => {
            const existingSignatures = new Set(
                prev.filter(l => !l.isExisting).map(l => l._fileSignature)
            );

            const filteredNewServiceRecords = uniqueNewServiceRecords.filter(serviceRecord =>
                !existingSignatures.has(serviceRecord._fileSignature)
            );

            return [...filteredNewServiceRecords, ...prev];
        });

        e.target.value = '';
    };

    const removeServiceRecord = (index) => {
        const serviceRecordToRemove = allServiceRecords[index];

        if (serviceRecordToRemove.isExisting) {
            setRemovedServiceRecords(prev => [...prev, serviceRecordToRemove.id]);
        }

        setAllServiceRecords(prev => prev.filter((_, i) => i !== index));
    };

    const removePhoto = (index) => {
        const photoToRemove = allPhotos[index];

        if (photoToRemove.isExisting) {
            setRemovedPhotos(prev => [...prev, photoToRemove.id]);
        }

        // Remove from all photos
        setAllPhotos(prev => prev.filter((_, i) => i !== index));

        // Remove corresponding caption
        const newCaptions = [...photoCaptions];
        newCaptions.splice(index, 1);
        setPhotoCaptions(newCaptions);

        if (allPhotos.length === 1) {
            setError('photos', {
                type: 'manual',
                message: 'At least one photo is required'
            });
        }
    };

    const handleDocumentUpload = (e) => {
        const files = Array.from(e.target.files);
        setUploadedDocuments([...uploadedDocuments, ...files]);

        // Initialize captions for new documents
        const newCaptions = [...uploadedDocumentCaptions];
        files.forEach(() => newCaptions.push(''));
        setUploadedDocumentCaptions(newCaptions);
    };

    const removeDocument = (index, isExisting = false) => {
        if (isExisting) {
            const removedDoc = existingDocuments[index];
            setRemovedDocuments(prev => [...prev, removedDoc.publicId || removedDoc._id]);
            setExistingDocuments(existingDocuments.filter((_, i) => i !== index));

            // Remove caption
            const newCaptions = [...documentCaptions];
            newCaptions.splice(index, 1);
            setDocumentCaptions(newCaptions);
        } else {
            setUploadedDocuments(uploadedDocuments.filter((_, i) => i !== index));

            // Remove caption
            const newCaptions = [...uploadedDocumentCaptions];
            newCaptions.splice(index, 1);
            setUploadedDocumentCaptions(newCaptions);
        }
    };

    // Add these handler functions
    const handlePhotoCaptionChange = (index, value) => {
        const newCaptions = [...photoCaptions];
        newCaptions[index] = value;
        setPhotoCaptions(newCaptions);
    };

    // Update the handler to handle both existing and new documents
    const handleDocumentCaptionChange = (type, index, value) => {
        if (type === 'existing') {
            const newCaptions = [...documentCaptions];
            newCaptions[index] = value;
            setDocumentCaptions(newCaptions);
        } else {
            const newCaptions = [...uploadedDocumentCaptions];
            newCaptions[index] = value;
            setUploadedDocumentCaptions(newCaptions);
        }
    };

    const handleServiceRecordCaptionChange = (index, value) => {
        const newCaptions = [...serviceRecordCaptions];
        newCaptions[index] = value;
        setServiceRecordCaptions(newCaptions);
    };

    // Update auction handler with fixed photo handling
    const updateAuctionHandler = async (formData) => {
        try {
            setIsSubmitting(true);

            const formDataToSend = new FormData();

            // Append all text fields
            formDataToSend.append('title', formData.title);
            formDataToSend.append('subTitle', formData.subTitle || '');
            // formDataToSend.append('category', formData.category);
            if (formData.categories) {
                if (Array.isArray(formData.categories)) {
                    formData.categories.forEach(cat => {
                        formDataToSend.append('categories', cat);
                    });
                } else {
                    formDataToSend.append('categories', formData.categories);
                }
            }
            formDataToSend.append('features', formData.features || '');
            formDataToSend.append('description', formData.description);
            formDataToSend.append('location', formData.location || '');
            formDataToSend.append('videoLink', formData.video || '');
            formDataToSend.append('startPrice', formData.startPrice);
            formDataToSend.append('auctionType', formData.auctionType);
            formDataToSend.append('allowOffers', formData.allowOffers || false);
            formDataToSend.append('startDate', new Date(formData.startDate).toISOString());
            formDataToSend.append('endDate', new Date(formData.endDate).toISOString());

            // Get specifications from form data
            const currentSpecifications = formData.specifications || {};
            if (currentSpecifications && Object.keys(currentSpecifications).length > 0) {
                formDataToSend.append('specifications', JSON.stringify(currentSpecifications));
            }

            // Add removed photos and documents
            if (removedPhotos.length > 0) {
                formDataToSend.append('removedPhotos', JSON.stringify(removedPhotos));
            }

            // Send the complete photo order
            const photoOrder = allPhotos.map(photo => ({
                id: photo.id,
                isExisting: photo.isExisting
            }));
            formDataToSend.append('photoOrder', JSON.stringify(photoOrder));

            // Send the complete service record order
            const serviceRecordOrder = allServiceRecords.map(serviceRecord => ({
                id: serviceRecord.id,
                isExisting: serviceRecord.isExisting
            }));
            formDataToSend.append('serviceRecordOrder', JSON.stringify(serviceRecordOrder));

            // 1. SEND CAPTIONS FOR ALL PHOTOS (BOTH EXISTING AND NEW)
            allPhotos.forEach((photo, index) => {
                // Send caption for this photo
                formDataToSend.append('photoCaptions', photoCaptions[index] || '');

                // Only send file if it's a new photo
                if (!photo.isExisting && photo.file) {
                    formDataToSend.append('photos', photo.file);
                }
            });

            // 2. SEND CAPTIONS AND FILES FOR DOCUMENTS
            // Existing documents
            documentCaptions.forEach((caption, index) => {
                formDataToSend.append('existingDocumentCaptions', caption || '');
            });

            // New documents
            uploadedDocuments.forEach((doc, index) => {
                formDataToSend.append('documents', doc);
                formDataToSend.append('newDocumentCaptions', uploadedDocumentCaptions[index] || '');
            });

            // 3. SEND CAPTIONS FOR ALL SERVICE RECORDS (BOTH EXISTING AND NEW)
            allServiceRecords.forEach((record, index) => {
                // Send caption for this service record
                formDataToSend.append('serviceRecordCaptions', serviceRecordCaptions[index] || '');

                // Only send file if it's a new service record
                if (!record.isExisting && record.file) {
                    formDataToSend.append('serviceRecords', record.file);
                }
            });

            if (formData.auctionType === 'standard' || formData.auctionType === 'reserve') {
                formDataToSend.append('bidIncrement', formData.bidIncrement);
            }

            // Append reserve price if applicable
            if (formData.auctionType === 'reserve' && formData.reservePrice) {
                formDataToSend.append('reservePrice', formData.reservePrice);
            }

            // Append buy now price if applicable
            if (formData.auctionType === 'buy_now' && formData.buyNowPrice) {
                formDataToSend.append('buyNowPrice', formData.buyNowPrice);
            }

            if (removedDocuments.length > 0) {
                formDataToSend.append('removedDocuments', JSON.stringify(removedDocuments));
            }

            if (removedServiceRecords.length > 0) {
                formDataToSend.append('removedServiceRecords', JSON.stringify(removedServiceRecords));
            }

            // Remove or fix the debug logging
            // console.log('FormData entries:');
            // for (let pair of formDataToSend.entries()) {
            //     const value = pair[1];
            //     const isFile = value && typeof value === 'object' && value.name;
            //     console.log(pair[0] + ': ' + (isFile ? '[FILE]' : value));
            // }

            // Use admin-specific endpoint
            const { data } = await axiosInstance.put(
                `/api/v1/admin/auctions/${auctionId}`,
                formDataToSend,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    }
                }
            );

            if (data.success) {
                toast.success('Auction updated successfully!');
                navigate('/admin/auctions/all');
            } else {
                throw new Error(data.message || 'Failed to update auction');
            }
        } catch (error) {
            console.error('Error updating auction:', error);
            const errorMessage = error?.response?.data?.message || 'Failed to update auction';
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Cleanup object URLs when component unmounts or photos change
    useEffect(() => {
        return () => {
            // Clean up object URLs for new photos
            allPhotos.forEach(photo => {
                if (!photo.isExisting && photo.url && photo.url.startsWith('blob:')) {
                    URL.revokeObjectURL(photo.url);
                }
            });
        };
    }, []);

    if (isLoading) {
        return (
            <section className="flex min-h-screen bg-gray-50">
                <AdminSidebar />
                <div className="w-full relative">
                    <AdminHeader />
                    <AdminContainer>
                        <div className="pt-16 md:py-7 flex justify-center items-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
                        </div>
                    </AdminContainer>
                </div>
            </section>
        );
    }

    return (
        <DndProvider backend={HTML5Backend}>
            <section className="flex min-h-screen bg-gray-50">
                <AdminSidebar />

                <UploadProgressModal
                    isOpen={isSubmitting && hasNewUploads}
                    fileCount={totalNewFiles}
                    isEdit={true}
                />

                <div className="w-full relative">
                    <AdminHeader />

                    <AdminContainer>
                        <div className="pt-16 md:py-7">
                            <div className="flex items-center gap-3 mb-5">
                                <button
                                    onClick={() => navigate('/admin/auctions')}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <ArrowLeft size={20} />
                                </button>
                                <h1 className="text-3xl md:text-4xl font-bold">Edit Auction (Admin)</h1>
                            </div>
                            {/* <p className="text-gray-600 mb-8">Update auction listing as administrator</p> */}

                            {/* Progress Steps */}
                            <div className="mb-8">
                                <div className="flex items-center justify-between mb-4">
                                    {['Auction Info', 'Pricing & Bidding', 'Review & Submit'].map((label, index) => (
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

                            <form onSubmit={handleSubmit(updateAuctionHandler)} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                                {/* Step 1: Auction Information */}
                                {step === 1 && (
                                    <div>
                                        <h2 className="text-xl font-semibold mb-6 flex items-center">
                                            <FileText size={20} className="mr-2" />
                                            Vehicle Information
                                        </h2>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                            <div>
                                                <label htmlFor="title" className="block text-sm font-medium text-secondary mb-1">Item Name *</label>
                                                <input
                                                    {...register('title', { required: 'Item name is required' })}
                                                    id="title"
                                                    type="text"
                                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                                    placeholder="e.g., 2017 VANS RV-6A"
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
                                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                    disabled={loadingCategories}
                                                    size={Math.min(6, categories.length + 1)}
                                                    value={watch('categories') || []} // Add this line
                                                    onChange={(e) => {
                                                        const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                                                        setValue('categories', selectedOptions, { shouldValidate: true });
                                                    }}
                                                >
                                                    <option value="" disabled>Select categories (hold Ctrl/Cmd to select multiple)</option>
                                                    {categories.map(cat => (
                                                        <option key={cat.slug} value={cat.slug}>
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

                                        {/* Category-specific fields */}
                                        {renderCategoryFields()}

                                        {/* Avionics Section - Only for Aircraft */}
                                        {/* {selectedCategory && (
                                            <div className="bg-white p-4 rounded-lg shadow-sm">
                                                <h4 className="font-medium mb-3">Vehicle Specifications</h4>
                                                <div className="space-y-4">
                                                    <div className="border-b pb-3">
                                                        <h5 className="font-medium text-sm mb-2">Vehicle Information</h5>
                                                        <div className="grid grid-cols-2 gap-3">
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

                                                    <div>
                                                        <h5 className="font-medium text-sm mb-2">Extra Information</h5>
                                                        <div className="grid grid-cols-2 gap-3">
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
                                            </div>
                                        )} */}

                                        <div className="mb-6">
                                            <label htmlFor="description" className="block text-sm font-medium text-secondary mb-1">Description *</label>
                                            <RTE
                                                name="description"
                                                control={control}
                                                label="Description:"
                                                defaultValue={getValues('description') || ''}
                                                onBlur={(value) => {
                                                    setValue('description', value, { shouldValidate: true });
                                                }}
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
                                                        placeholder="e.g., Dallas, Texas"
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
                                                        placeholder="YouTube video URL"
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
                                                    <p className="text-sm text-secondary">Recommended: at least 40 high-quality photos</p>
                                                </label>
                                            </div>
                                            {errors.photos && <p className="text-red-500 text-sm mt-1">{errors.photos.message}</p>}

                                            {/* Unified Photo Gallery with Fixed Drag & Drop */}
                                            {allPhotos.length > 0 && (
                                                <PhotoGallery
                                                    photos={allPhotos}
                                                    movePhoto={movePhoto}
                                                    removePhoto={removePhoto}
                                                    captions={photoCaptions} // Add this
                                                    onCaptionChange={handlePhotoCaptionChange} // Add this
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
                                                    <p className="text-sm text-secondary">service Records, maintenance records, ownership docs, etc.</p>
                                                </label>
                                            </div>

                                            {/* Display existing documents with captions */}
                                            {existingDocuments.length > 0 && (
                                                <div className="mt-4">
                                                    <p className="text-sm text-secondary mb-2">Existing Documents:</p>
                                                    <div className="space-y-2">
                                                        {existingDocuments.map((doc, index) => (
                                                            <div key={`existing-doc-${index}`} className="bg-gray-50 p-3 rounded-lg">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <span className="text-sm font-medium truncate">{doc.filename || doc.originalName}</span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => removeDocument(index, true)}
                                                                        className="text-red-500 hover:text-red-700"
                                                                    >
                                                                        <X size={16} />
                                                                    </button>
                                                                </div>
                                                                {/* Caption input for existing documents */}
                                                                <input
                                                                    type="text"
                                                                    placeholder="Add document caption..."
                                                                    value={documentCaptions[index] || ''}
                                                                    onChange={(e) => handleDocumentCaptionChange('existing', index, e.target.value)}
                                                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Display newly uploaded documents with captions */}
                                            {uploadedDocuments.length > 0 && (
                                                <div className="mt-4">
                                                    <p className="text-sm text-secondary mb-2">New Documents:</p>
                                                    <div className="space-y-2">
                                                        {uploadedDocuments.map((doc, index) => (
                                                            <div key={`new-doc-${index}`} className="bg-gray-50 p-3 rounded-lg">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <span className="text-sm font-medium truncate">{doc.name}</span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => removeDocument(index, false)}
                                                                        className="text-red-500 hover:text-red-700"
                                                                    >
                                                                        <X size={16} />
                                                                    </button>
                                                                </div>
                                                                {/* Caption input for new documents */}
                                                                <input
                                                                    type="text"
                                                                    placeholder="Add document caption..."
                                                                    value={uploadedDocumentCaptions[index] || ''}
                                                                    onChange={(e) => handleDocumentCaptionChange('new', index, e.target.value)}
                                                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Service History Images Section */}
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

                                            {/* Unified Service History Gallery with Drag & Drop */}
                                            {allServiceRecords.length > 0 && (
                                                <div className="mt-4">
                                                    <p className="text-sm text-secondary mb-3">
                                                        Drag and drop to reorder service history images.
                                                        <span className="block text-xs text-gray-500 mt-1">
                                                            Blue badge indicates existing service records
                                                        </span>
                                                    </p>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                                        {allServiceRecords.map((record, index) => (
                                                            <DraggablePhoto
                                                                key={record.id}
                                                                photo={record}
                                                                index={index}
                                                                movePhoto={moveServiceRecord}
                                                                removePhoto={removeServiceRecord}
                                                                caption={serviceRecordCaptions[index] || ''} // Add this
                                                                onCaptionChange={handleServiceRecordCaptionChange} // Add this
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
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

                                            {(auctionType === 'standard' || auctionType === 'reserve') && (
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
                                            )}
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
                                                <p className="text-sm text-secondary mt-1">Item will not sell if bids don't reach this price</p>
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
                                                                <div className="flex flex-wrap gap-2">
                                                                    {watch('categories')?.map((cat, index) => (
                                                                        <span key={index} className="bg-gray-100 px-2 py-1 rounded text-sm">
                                                                            {cat}
                                                                        </span>
                                                                    ))}
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

                                                    {/* Media - UPDATED for edit page */}
                                                    <div className="bg-white p-4 rounded-lg shadow-sm">
                                                        <h4 className="font-medium mb-3">Media & Documents</h4>
                                                        <div className="space-y-2">
                                                            <div className="flex justify-between items-center">
                                                                <p className="text-xs text-secondary">Total Photos</p>
                                                                <span className="font-medium bg-gray-100 px-2 py-1 rounded-full text-xs">
                                                                    {allPhotos.length} photos
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between items-center">
                                                                <p className="text-xs text-secondary">Existing Photos</p>
                                                                <span className="font-medium bg-gray-100 px-2 py-1 rounded-full text-xs">
                                                                    {allPhotos.filter(photo => photo.isExisting).length} photos
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between items-center">
                                                                <p className="text-xs text-secondary">New Photos</p>
                                                                <span className="font-medium bg-gray-100 px-2 py-1 rounded-full text-xs">
                                                                    {allPhotos.filter(photo => !photo.isExisting).length} uploaded
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between items-center">
                                                                <p className="text-xs text-secondary">Documents</p>
                                                                <span className="font-medium bg-gray-100 px-2 py-1 rounded-full text-xs">
                                                                    {existingDocuments.length + uploadedDocuments.length} total
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between items-center">
                                                                <p className="text-xs text-secondary">Service Records</p>
                                                                <span className="font-medium bg-gray-100 px-2 py-1 rounded-full text-xs">
                                                                    {allServiceRecords.length} total ({allServiceRecords.filter(l => l.isExisting).length} existing, {allServiceRecords.filter(l => !l.isExisting).length} new)
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
                                            disabled={isSubmitting}
                                            className="flex items-center px-6 py-2 bg-[#edcd1f] text-black rounded-lg hover:bg-[#edcd1f]/90 transition-colors disabled:opacity-50"
                                        >
                                            <Gavel size={18} className="mr-2" />
                                            {isSubmitting ? 'Updating Auction...' : 'Update Auction'}
                                        </button>
                                    )}
                                </div>
                                {errors.endDate && <p className='text-sm text-orange-500 float-right'>Please set end date to proceed.</p>}
                            </form>
                        </div>
                    </AdminContainer>
                </div>
            </section>
        </DndProvider>
    );
};

export default EditAuction;