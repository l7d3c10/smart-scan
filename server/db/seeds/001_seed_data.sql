-- Seed: 1 admin user + 30 documents mẫu
-- password_hash là bcrypt của 'admin123' (placeholder, Người 3 sẽ override)
INSERT INTO users (username, password_hash, role) VALUES
  ('admin', '$2b$10$placeholder_hash_replace_by_member3', 'admin')
ON CONFLICT DO NOTHING;

-- Seed documents (owner_id = 1 = admin)
INSERT INTO documents (code, title, type, description, owner_id, created_at, updated_at) VALUES
  ('TL-0001', 'Hóa đơn mua văn phòng phẩm Q1 2026',       'hoa_don',  'Hóa đơn GTGT mua văn phòng phẩm quý 1 năm 2026',                  1, NOW() - INTERVAL '90 days', NOW() - INTERVAL '90 days'),
  ('TL-0002', 'Hợp đồng thuê văn phòng 2026',               'hop_dong', 'Hợp đồng thuê văn phòng tòa nhà Landmark, hiệu lực từ 01/2026',   1, NOW() - INTERVAL '88 days', NOW() - INTERVAL '88 days'),
  ('TL-0003', 'Giấy phép kinh doanh công ty',               'giay_to',  'Giấy phép kinh doanh số 0123456789 do Sở KH&ĐT cấp',              1, NOW() - INTERVAL '86 days', NOW() - INTERVAL '86 days'),
  ('TL-0004', 'Biên bản họp HĐQT tháng 1/2026',            'bien_ban', 'Biên bản họp Hội đồng quản trị tháng 01 năm 2026',                1, NOW() - INTERVAL '84 days', NOW() - INTERVAL '84 days'),
  ('TL-0005', 'Hóa đơn dịch vụ điện thoại tháng 2',        'hoa_don',  'Hóa đơn cước viễn thông tháng 02/2026',                           1, NOW() - INTERVAL '82 days', NOW() - INTERVAL '82 days'),
  ('TL-0006', 'Hợp đồng cung cấp phần mềm CRM',            'hop_dong', 'Hợp đồng mua bản quyền phần mềm CRM 3 năm',                       1, NOW() - INTERVAL '80 days', NOW() - INTERVAL '80 days'),
  ('TL-0007', 'Giấy ủy quyền ký kết hợp đồng',             'giay_to',  'Giấy ủy quyền cho Giám đốc chi nhánh ký hợp đồng thương mại',     1, NOW() - INTERVAL '78 days', NOW() - INTERVAL '78 days'),
  ('TL-0008', 'Biên bản bàn giao tài sản thiết bị IT',      'bien_ban', 'Biên bản bàn giao laptop, màn hình cho phòng kỹ thuật',           1, NOW() - INTERVAL '76 days', NOW() - INTERVAL '76 days'),
  ('TL-0009', 'Hóa đơn mua máy in laser',                   'hoa_don',  'Hóa đơn mua máy in HP LaserJet cho văn phòng',                    1, NOW() - INTERVAL '74 days', NOW() - INTERVAL '74 days'),
  ('TL-0010', 'Hợp đồng bảo hiểm tài sản công ty',         'hop_dong', 'Hợp đồng bảo hiểm cháy nổ và tài sản năm 2026',                   1, NOW() - INTERVAL '72 days', NOW() - INTERVAL '72 days'),
  ('TL-0011', 'Giấy chứng nhận ISO 9001:2015',              'giay_to',  'Chứng nhận hệ thống quản lý chất lượng ISO 9001:2015',             1, NOW() - INTERVAL '70 days', NOW() - INTERVAL '70 days'),
  ('TL-0012', 'Biên bản kiểm kê tài sản Q1 2026',          'bien_ban', 'Biên bản kiểm kê toàn bộ tài sản cố định quý 1/2026',             1, NOW() - INTERVAL '68 days', NOW() - INTERVAL '68 days'),
  ('TL-0013', 'Hóa đơn dịch vụ internet văn phòng',         'hoa_don',  'Hóa đơn cước internet băng thông 500Mbps tháng 3/2026',           1, NOW() - INTERVAL '66 days', NOW() - INTERVAL '66 days'),
  ('TL-0014', 'Hợp đồng lao động Nguyễn Văn A',             'hop_dong', 'Hợp đồng lao động thời hạn 1 năm, vị trí kỹ sư phần mềm',        1, NOW() - INTERVAL '64 days', NOW() - INTERVAL '64 days'),
  ('TL-0015', 'Giấy xác nhận công tác nước ngoài',          'giay_to',  'Giấy xác nhận công tác Nhật Bản từ 15-22/03/2026',                1, NOW() - INTERVAL '62 days', NOW() - INTERVAL '62 days'),
  ('TL-0016', 'Biên bản nghiệm thu dự án phần mềm',         'bien_ban', 'Biên bản nghiệm thu giai đoạn 1 dự án SmartScan',                 1, NOW() - INTERVAL '60 days', NOW() - INTERVAL '60 days'),
  ('TL-0017', 'Hóa đơn thuê xe công tác tháng 4',          'hoa_don',  'Hóa đơn dịch vụ thuê xe ô tô tháng 04/2026',                     1, NOW() - INTERVAL '55 days', NOW() - INTERVAL '55 days'),
  ('TL-0018', 'Hợp đồng quảng cáo trực tuyến 2026',        'hop_dong', 'Hợp đồng chạy quảng cáo Google Ads và Facebook Ads năm 2026',     1, NOW() - INTERVAL '50 days', NOW() - INTERVAL '50 days'),
  ('TL-0019', 'Giấy phép xuất khẩu hàng hóa',              'giay_to',  'Giấy phép xuất khẩu thiết bị điện tử sang thị trường ASEAN',      1, NOW() - INTERVAL '48 days', NOW() - INTERVAL '48 days'),
  ('TL-0020', 'Biên bản họp triển khai dự án Q2',           'bien_ban', 'Biên bản họp kick-off dự án triển khai hệ thống ERP Q2/2026',     1, NOW() - INTERVAL '45 days', NOW() - INTERVAL '45 days'),
  ('TL-0021', 'Hóa đơn mua bàn ghế văn phòng',              'hoa_don',  'Hóa đơn GTGT mua nội thất văn phòng mới',                        1, NOW() - INTERVAL '40 days', NOW() - INTERVAL '40 days'),
  ('TL-0022', 'Hợp đồng bảo trì hệ thống điều hòa',        'hop_dong', 'Hợp đồng bảo trì định kỳ hệ thống điều hòa trung tâm',           1, NOW() - INTERVAL '35 days', NOW() - INTERVAL '35 days'),
  ('TL-0023', 'Giấy tờ nhà đất chi nhánh Hà Nội',           'giay_to',  'Hồ sơ pháp lý văn phòng chi nhánh tại quận Cầu Giấy, Hà Nội',   1, NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'),
  ('TL-0024', 'Biên bản thanh lý tài sản cũ',               'bien_ban', 'Biên bản thanh lý máy tính cũ và thiết bị hỏng',                  1, NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days'),
  ('TL-0025', 'Hóa đơn dịch vụ kế toán thuế Q2',           'hoa_don',  'Hóa đơn dịch vụ kế toán và khai báo thuế quý 2/2026',            1, NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days'),
  ('TL-0026', 'Hợp đồng thuê kho bãi Bình Dương',           'hop_dong', 'Hợp đồng thuê kho chứa hàng 500m2 tại KCN Bình Dương',           1, NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'),
  ('TL-0027', 'Giấy chứng nhận đăng ký nhãn hiệu',          'giay_to',  'Chứng nhận đăng ký nhãn hiệu SmartScan tại Cục SHTT',             1, NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),
  ('TL-0028', 'Biên bản kiểm tra PCCC định kỳ',             'bien_ban', 'Biên bản kiểm tra phòng cháy chữa cháy 6 tháng đầu năm 2026',    1, NOW() - INTERVAL '8 days',  NOW() - INTERVAL '8 days'),
  ('TL-0029', 'Hóa đơn mua phần mềm diệt virus',            'hoa_don',  'Hóa đơn gia hạn bản quyền Kaspersky Enterprise cho 50 máy',      1, NOW() - INTERVAL '4 days',  NOW() - INTERVAL '4 days'),
  ('TL-0030', 'Hợp đồng tư vấn chuyển đổi số 2026-2027',   'hop_dong', 'Hợp đồng tư vấn chiến lược chuyển đổi số giai đoạn 2026-2027',   1, NOW() - INTERVAL '1 day',   NOW() - INTERVAL '1 day')
ON CONFLICT (code) DO NOTHING;

-- Update sequence sau khi seed
SELECT setval('document_code_seq', 30);
