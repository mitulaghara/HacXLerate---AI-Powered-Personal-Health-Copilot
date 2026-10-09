const fs = require('fs');
const path = require('path');

// 1. Patch Backend doctorController.js
const docCtrlPath = path.join('d:', 'finalsih', 'SIH-2026', 'backend', 'controllers', 'doctorController.js');
let docCtrl = fs.readFileSync(docCtrlPath, 'utf8');

const targetStr = `    const updateData = {
      doctorId: docId,
      doctorName,
      specialization: specialization || 'General Physician',
      qualification: qualification || 'MBBS',
      phone,
      email: email ? email.toLowerCase().trim() : '',
      registrationNumber: registrationNumber || 'NMC-REG-PENDING',
      medicalCouncil: medicalCouncil || 'National Medical Commission',
      experienceYears: Number(experienceYears) || 0,
      profilePhoto: profilePhoto || '',`;

const replaceStr = `    let updatedProfilePhoto = profilePhoto || '';
    let updatedLogo = branding?.logo || '';
    let updatedSignature = branding?.signatureImage || '';

    const cloudinary = require('../utils/cloudinary');
    const uploadImage = async (base64Img) => {
      if (base64Img && base64Img.startsWith('data:image')) {
        try {
          const uploadResponse = await cloudinary.uploader.upload(base64Img, {
            folder: 'graminarogya/doctor_profiles',
          });
          return uploadResponse.secure_url;
        } catch (err) {
          console.error('Cloudinary Upload Error:', err);
          return base64Img;
        }
      }
      return base64Img;
    };

    updatedProfilePhoto = await uploadImage(updatedProfilePhoto);
    updatedLogo = await uploadImage(updatedLogo);
    updatedSignature = await uploadImage(updatedSignature);

    const updateData = {
      doctorId: docId,
      doctorName,
      specialization: specialization || 'General Physician',
      qualification: qualification || 'MBBS',
      phone,
      email: email ? email.toLowerCase().trim() : '',
      registrationNumber: registrationNumber || 'NMC-REG-PENDING',
      medicalCouncil: medicalCouncil || 'National Medical Commission',
      experienceYears: Number(experienceYears) || 0,
      profilePhoto: updatedProfilePhoto,`;

if (docCtrl.includes(targetStr)) {
  docCtrl = docCtrl.replace(targetStr, replaceStr);
  docCtrl = docCtrl.replace("logo: branding?.logo || '',", "logo: updatedLogo,");
  docCtrl = docCtrl.replace("signatureImage: branding?.signatureImage || '',", "signatureImage: updatedSignature,");
  fs.writeFileSync(docCtrlPath, docCtrl, 'utf8');
  console.log("Backend patched successfully.");
} else {
  console.log("Could not find target string in backend.");
}
