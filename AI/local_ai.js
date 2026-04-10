const tf = require('@tensorflow/tfjs');
const mobilenet = require('@tensorflow-models/mobilenet');

class LocalAI {
  constructor() {
    this.model = null;
    this.isModelLoading = false;
    
    // The 8 Urban Classification Groups
    this.groups = {
      'garbage': { id: 'trash', name: 'Rác thải' },
      'infrastructure': { id: 'infrastructure', name: 'Hạ tầng hư hỏng' },
      'signs': { id: 'signs', name: 'Biển báo / Cột / Đèn' },
      'trees': { id: 'trees', name: 'Cây cối nguy hiểm' },
      'flood': { id: 'flood', name: 'Ngập lụt' },
      'electric': { id: 'electric', name: 'Điện / Dây' },
      'construction': { id: 'construction', name: 'Công trình' },
      'encroachment': { id: 'encroachment', name: 'Lấn chiếm vỉa hè' } // Simplified as requested
    };

    // Mapping keywords to groups based on user feedback (Turn 130)
    this.keywordToGroup = {
      // Group 1: Rác thải
      'garbage': 'garbage', 'trash': 'garbage', 'ashbin': 'garbage', 'wastebin': 'garbage', 'plastic bag': 'garbage',
      'packet': 'garbage', 'carton': 'garbage', 'envelope': 'garbage', 'mailbag': 'garbage',
      'parcel': 'garbage', 'box': 'garbage', 'paper': 'garbage', 'wrapper': 'garbage', 'bag': 'garbage',
      
      // Group 2: Hạ tầng hư hỏng
      'pothole': 'infrastructure', 'manhole': 'infrastructure', 'sewer': 'infrastructure', 'pipe': 'infrastructure',
      'sandbar': 'infrastructure', 'sand bar': 'infrastructure',
      'geyser': 'infrastructure',
      'crater': 'infrastructure', 'pit': 'infrastructure', 'quarry': 'infrastructure',
      'earthwork': 'infrastructure', 'mud flat': 'infrastructure', 'soil': 'infrastructure',
      'rocky': 'infrastructure', 'asphalt': 'infrastructure', 'pavement': 'infrastructure',
      
      // Group 3: Biển báo / Cột / Đèn
      'sign': 'signs', 'lamp': 'signs', 'pole': 'signs', 'light': 'signs', 'stop sign': 'signs',
      'spotlight': 'signs', 'spot': 'signs', // User Image 3
      'birdhouse': 'signs', // User Image 6 (small sign looks like birdhouse)
      'beacon': 'signs', 'lighthouse': 'signs',
      
      // Group 4: Cây cối nguy hiểm
      'tree': 'trees', 'fallen tree': 'trees', 'timber': 'trees', 'log': 'trees', 'trunk': 'trees',
      'valley': 'trees', 'vale': 'trees', 'cannon': 'trees', // User Image 4 (cannon-like branches)
      
      // Group 5: Ngập lụt
      'water': 'flood', 'puddle': 'flood', 'flood': 'flood', 'lake': 'flood', 'river': 'flood', 'pond': 'flood', 
      'sea coast': 'flood', 'seashore': 'flood', 'coast': 'flood',
      'ski': 'flood', 'snow': 'flood', 'glacier': 'flood', 'maillot': 'flood', 'bubble': 'flood',
      'breakwater': 'flood', 'groin': 'flood', 'mole': 'flood', 'seawall': 'flood', 'jetty': 'flood', // User Image 1
      
      // Group 6: Điện / Dây
      'wire': 'electric', 'electric': 'electric', 'cable': 'electric',
      
      // Group 7: Công trình
      'wall': 'construction', 'fence': 'construction', 'structure': 'construction', 'stone wall': 'construction', 'picket fence': 'construction',
      
      // Group 8: Lấn chiếm
      'stall': 'encroachment', 'motorcycle': 'encroachment', 'moped': 'encroachment', 'scooter': 'encroachment', 'rickshaw': 'encroachment', 'bicycle': 'encroachment', 'jinrikisha': 'encroachment'
    };

    // Tier 2: Status/Damage detection keywords
    this.statusKeywords = {
      'broken': 'damaged', 'damaged': 'damaged', 'bent': 'damaged', 'rusted': 'damaged',
      'corrosion': 'damaged', 'fallen': 'damaged', 'collapsed': 'damaged', 'encroach': 'illegal',
      'overflow': 'overflow', 'overflooded': 'overflow', 'submerged': 'damaged'
    };
  }

  async loadModel() {
    if (this.model || this.isModelLoading) return;
    try {
      this.isModelLoading = true;
      console.log('[Local AI] Loading MobileNet model...');
      this.model = await mobilenet.load({ version: 2, alpha: 1.0 });
      console.log('[Local AI] Model loaded successfully.');
    } catch (error) {
      console.error('[Local AI] Failed to load model:', error);
    } finally {
      this.isModelLoading = false;
    }
  }

  async predict(rgbaData, width, height) {
    if (!rgbaData) {
      console.error('[Local AI] No image data provided for prediction.');
      return null;
    }
    if (!this.model) { await this.loadModel(); if (!this.model) return null; }

    try {
      const numChannels = 3;
      const flatData = new Uint8Array(width * height * numChannels);
      for (let i = 0; i < width * height; i++) {
        flatData[i * 3] = rgbaData[i * 4];     // R
        flatData[i * 3 + 1] = rgbaData[i * 4 + 1]; // G
        flatData[i * 3 + 2] = rgbaData[i * 4 + 2]; // B
      }
      const tensor = tf.tensor3d(flatData, [height, width, numChannels]).resizeNearestNeighbor([224, 224]).toFloat().expandDims();
      const predictions = await this.model.classify(tensor);
      tensor.dispose(); 
      if (!predictions || predictions.length === 0) return null;

      console.log('[Local AI] Top predictions:', predictions.map(p => `${p.className} (${Math.round(p.probability * 100)}%)`).join(', '));

      let detectedGroupKey = null;
      let detectedObjectKey = null;
      let detectedStatus = null;
      const topFive = predictions.slice(0, 5);

      for (const pred of topFive) {
        const className = pred.className.toLowerCase();
        if (!detectedGroupKey) {
          for (const [kw, groupKey] of Object.entries(this.keywordToGroup)) {
            if (className.includes(kw)) { detectedGroupKey = groupKey; detectedObjectKey = kw; break; }
          }
        }
        if (!detectedStatus) {
          for (const [key, status] of Object.entries(this.statusKeywords)) {
            if (className.includes(key)) { detectedStatus = { key, status }; break; }
          }
        }
      }

      if (detectedGroupKey) {
        const groupInfo = this.groups[detectedGroupKey];
        const isProblematic = ['garbage', 'infrastructure', 'signs', 'flood', 'encroachment', 'electric', 'trees'].includes(detectedGroupKey);
        
        // Simplified labels: Just return the Group Name
        if (detectedStatus) {
          return {
            is_valid: true, 
            label: `${groupInfo.name} (Có sự cố)`, 
            category: groupInfo.id, 
            confidence: Math.round(predictions[0].probability * 100)
          };
        }
        return {
          is_valid: isProblematic, 
          label: groupInfo.name, 
          category: groupInfo.id, 
          confidence: Math.round(predictions[0].probability * 100)
        };
      }

      const topPred = predictions[0].className.toLowerCase();
      if (['metal', 'iron', 'steel', 'structure', 'post', 'cliff', 'wall', 'fence'].some(k => topPred.includes(k))) {
        return { is_valid: true, label: "Hạ tầng/Công trình (Cần kiểm tra)", category: "infrastructure", confidence: Math.round(predictions[0].probability * 100) };
      }

      return { is_valid: false, label: "Hình ảnh không xác định", category: "other", confidence: Math.round(predictions[0].probability * 100) };
    } catch (error) {
      console.error('[Local AI] Prediction error:', error); return null;
    }
  }

  translateLabel(key) {
    const translations = {
      'garbage': 'Rác thải', 'trash': 'Rác thải', 'ashbin': 'Thùng rác', 'plastic bag': 'Túi nilon/Rác',
      'packet': 'Bao bì/Rác thải vứt bừa', 'carton': 'Thùng giấy/Rác thải', 'envelope': 'Bao thư/Rác giấy',
      'mailbag': 'Túi rác/Bọc rác', 'parcel': 'Gói hàng/Rác thải', 'box': 'Hộp/Thùng rác',
      'paper': 'Rác giấy', 'wrapper': 'Vỏ bao bì/Rác', 'bag': 'Túi/Bao rác',
      'pothole': 'Ổ gà', 'manhole': 'Hố ga/Nắp cống', 'sewer': 'Cống thoát nước', 'pipe': 'Đường ống', 
      'sandbar': 'Mặt đường hư hỏng (Cát/Đá)', 'geyser': 'Hố sâu/Sụt lún',
      'crater': 'Ổ gà diện rộng/Vết lún', 'pit': 'Hố sâu/Ổ gà', 'quarry': 'Mặt đường hư hỏng/Ổ voi',
      'asphalt': 'Mặt đường (Nghi ngờ hư hỏng)', 'pavement': 'Vỉa hè/Mặt đường hỏng',
      'sign': 'Biển báo', 'lamp': 'Đèn đường', 'pole': 'Cột điện/Hạ tầng', 'light': 'Đèn chiếu sáng', 'spotlight': 'Đèn đường/Đèn pha', 'birdhouse': 'Biển báo/Hạ tầng',
      'tree': 'Cây xanh', 'fallen tree': 'Cây bị đổ', 'timber': 'Gỗ/Thân cây', 'log': 'Khúc gỗ', 'trunk': 'Thân cây', 'valley': 'Khu vực có cây xanh', 'cannon': 'Cành cây lớn',
      'water': 'Vùng nước', 'puddle': 'Vũng nước', 'flood': 'Khu vực ngập', 'lake': 'Vùng ngập', 'river': 'Vòng ngập (Sông)', 'breakwater': 'Bờ kè/Đê chắn',
      'wire': 'Dây điện', 'electric': 'Hệ thống điện', 'cable': 'Dây cáp',
      'wall': 'Bức tường', 'fence': 'Hàng rào', 'structure': 'Công trình', 'picket fence': 'Hàng rào/Vách ngăn',
      'stall': 'Gian hàng', 'motorcycle': 'Xe máy', 'moped': 'Xe máy', 'rickshaw': 'Xe đẩy/Ba gác', 'jinrikisha': 'Xe ba gác'
    };
    return translations[key] || key;
  }
}

module.exports = new LocalAI();
