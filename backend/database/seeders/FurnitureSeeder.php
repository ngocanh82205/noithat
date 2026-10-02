<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Collection;
use App\Models\FlashSale;
use App\Models\FlashSaleProduct;
use App\Models\Lookbook;
use App\Models\LookbookItem;
use App\Models\Product;
use App\Models\ProductFaq;
use App\Models\ProductImage;
use App\Models\ProductVariant;
use App\Models\Review;
use App\Models\User;
use App\Models\Voucher;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class FurnitureSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create Default Users (Admin & Customer)
        User::firstOrCreate(
            ['email' => 'admin@gsluxury.vn'],
            [
                'name' => 'GS Luxury Administrator',
                'phone' => '0901234567',
                'role' => 'admin',
                'password' => Hash::make('GsLuxury#2026!Secure'),
                'address' => 'Tòa nhà GS Luxury Tower, Hoàn Kiếm, Hà Nội',
            ]
        );

        $customer = User::firstOrCreate(
            ['email' => 'customer@gmail.com'],
            [
                'name' => 'Nguyễn Văn An',
                'phone' => '0988776655',
                'role' => 'customer',
                'password' => Hash::make('Customer@123456'),
                'address' => 'Vinhomes Riverside, Long Biên, Hà Nội',
            ]
        );

        // 2. Create Categories
        $categoriesData = [
            [
                'name' => 'Living Room',
                'slug' => 'living-room',
                'description' => 'Không gian phòng khách sang trọng, tinh tế với sofa da Ý, bàn trà cẩm thạch và ghế thư giãn.',
                'image' => '/images/sofa-1.jpg',
                'sort_order' => 1,
            ],
            [
                'name' => 'Bedroom',
                'slug' => 'bedroom',
                'description' => 'Không gian nghỉ ngơi chuẩn resort với giường ngủ cao cấp, tủ áo nghệ thuật và tab đầu giường.',
                'image' => '/images/bed-1.jpg',
                'sort_order' => 2,
            ],
            [
                'name' => 'Dining',
                'slug' => 'dining',
                'description' => 'Phòng ăn thượng lưu với bàn ăn đá tự nhiên, ghế ăn bọc da và tủ rượu đẳng cấp.',
                'image' => '/images/dining-table-1.jpg',
                'sort_order' => 3,
            ],
            [
                'name' => 'Lighting',
                'slug' => 'lighting',
                'description' => 'Hệ thống đèn chùm pha lê, đèn sàn đồng khối và gương trang trí nghệ thuật.',
                'image' => '/images/mirror-1.jpg',
                'sort_order' => 4,
            ],
            [
                'name' => 'Kitchen',
                'slug' => 'kitchen',
                'description' => 'Hệ tủ bếp và đảo bếp may đo theo tiêu chuẩn châu Âu hiện đại.',
                'image' => '/images/kitchen-3.jpg',
                'sort_order' => 5,
            ],
            [
                'name' => 'Bespoke Service',
                'slug' => 'bespoke',
                'description' => 'Dịch vụ thiết kế và đóng may đo nội thất độc bản theo yêu cầu riêng biệt.',
                'image' => '/images/desk-1.jpg',
                'sort_order' => 6,
            ],
        ];

        $categories = [];
        foreach ($categoriesData as $c) {
            $categories[$c['slug']] = Category::create($c);
        }

        // 3. Create Collections
        $collectionsData = [
            [
                'name' => 'The Velvet & Leather Series',
                'slug' => 'velvet-leather-series',
                'subtitle' => 'Nghệ thuật thuộc da và nhung tuyết Ý',
                'description' => 'Sự kết hợp hoàn hảo giữa da bò tự nhiên và chất liệu nhung hoàng gia.',
                'banner_image' => '/images/sofa-1.jpg',
                'room_type' => 'living_room',
                'is_featured' => true,
            ],
            [
                'name' => 'Handcrafted Marble',
                'slug' => 'handcrafted-marble',
                'subtitle' => 'Tuyệt tác đá cẩm thạch nguyên khối',
                'description' => 'Được khai thác từ những mỏ đá trứ danh và cắt gọt tỉ mỉ.',
                'banner_image' => '/images/coffee-table-1.jpg',
                'room_type' => 'living_room',
                'is_featured' => true,
            ],
            [
                'name' => 'Bedroom Sanctuary',
                'slug' => 'bedroom-sanctuary',
                'subtitle' => 'Chốn an yên tái tạo năng lượng',
                'description' => 'Thiết kế tối giản mang lại giấc ngủ trọn vẹn và êm ái.',
                'banner_image' => '/images/bed-1.jpg',
                'room_type' => 'bedroom',
                'is_featured' => true,
            ],
            [
                'name' => 'Bespoke Atelier',
                'slug' => 'bespoke-atelier',
                'subtitle' => 'Độc bản cho gia chủ tinh hoa',
                'description' => 'Mỗi sản phẩm là một tác phẩm mang dấu ấn cá nhân.',
                'banner_image' => '/images/desk-1.jpg',
                'room_type' => 'study',
                'is_featured' => false,
            ],
        ];

        $collections = [];
        foreach ($collectionsData as $col) {
            $collections[$col['slug']] = Collection::create($col);
        }

        // 4. Create Luxury Products
        $productsData = [
            [
                'id_slug' => 'sofa-velvet-01',
                'name' => 'Sofa Velvet Aurora',
                'sku' => 'GSL-SOFA-001',
                'category_slug' => 'living-room',
                'collection_slug' => 'velvet-leather-series',
                'price' => 128000000,
                'original_price' => 145000000,
                'summary' => 'Sofa bọc da Ý nguyên tấm, khung gỗ sồi tự nhiên hoàn thiện thủ công.',
                'description' => "Sofa Velvet Aurora là biểu tượng của sự sang trọng vượt thời gian. Toàn bộ bề mặt được bọc da bò thượng hạng nhập khẩu trực tiếp từ các xưởng thuộc da danh tiếng tại Florence, Ý. \n\nKhung gỗ sồi tự nhiên được sấy khô đạt chuẩn độ ẩm dưới 12%, chống cong vênh mối mọt trọn đời. Đệm mút D40 kết hợp lò xo túi kép độc lập mang lại độ đàn hồi êm ái, nâng đỡ cột sống hoàn hảo.",
                'material' => 'Da bò Ý cao cấp, Khung gỗ Sồi Bắc Mỹ, Chân hợp kim mạ PVD',
                'dimensions' => 'W: 240cm x D: 100cm x H: 85cm (Chiều cao đệm: 45cm)',
                'warranty' => '36 tháng cho khung và đệm, 24 tháng cho bề mặt da',
                'care_instructions' => 'Lau nhẹ bằng khăn mềm khô hoặc ẩm nhẹ, tránh ánh nắng gắt trực tiếp, dùng sáp dưỡng da chuyên dụng 6 tháng/lần.',
                'is_featured' => true,
                'is_new' => true,
                'is_bestseller' => true,
                'rating_avg' => 4.9,
                'rating_count' => 18,
                'images' => ['/images/sofa-1.jpg', '/images/sofa-2.jpg'],
                'variants' => [
                    ['name' => 'Cognac Leather / 3-Seater (2m4)', 'color_name' => 'Cognac Brown', 'color_hex' => '#8B4513', 'size' => '2m4', 'price' => 128000000],
                    ['name' => 'Ivory Velvet / 3-Seater (2m4)', 'color_name' => 'Ivory Cream', 'color_hex' => '#FFFFF0', 'size' => '2m4', 'price' => 118000000],
                    ['name' => 'Charcoal Leather / 4-Seater (2m8)', 'color_name' => 'Charcoal Grey', 'color_hex' => '#36454F', 'size' => '2m8', 'price' => 148000000],
                ],
            ],
            [
                'id_slug' => 'sofa-velvet-02',
                'name' => 'Sofa Modular Riviera',
                'sku' => 'GSL-SOFA-002',
                'category_slug' => 'living-room',
                'collection_slug' => 'velvet-leather-series',
                'price' => 156000000,
                'original_price' => 170000000,
                'summary' => 'Thiết kế module linh hoạt, đệm lông vũ cao cấp, dáng bo tròn mềm mại.',
                'description' => "Dòng sofa module cao cấp cho phép gia chủ tự do sáng tạo không gian sắp đặt. Đệm ngồi phủ lớp lông vũ tự nhiên êm ái, bọc vải linen dệt thô cao cấp thoáng khí mát mẻ vào mùa hè và ấm áp vào mùa đông.",
                'material' => 'Vải nỉ Bouclé nhập khẩu Bỉ, Đệm lông vũ tự nhiên, Khung gỗ Tần bì',
                'dimensions' => 'W: 300cm x D: 180cm x H: 78cm (Module ghép chữ L)',
                'warranty' => '36 tháng chính hãng',
                'care_instructions' => 'Hút bụi thường xuyên, giặt khô vỏ đệm khi cần vệ sinh chuyên sâu.',
                'is_featured' => false,
                'is_new' => true,
                'is_bestseller' => false,
                'rating_avg' => 4.8,
                'rating_count' => 12,
                'images' => ['/images/sofa-3.webp', '/images/sofa-1.jpg'],
                'variants' => [
                    ['name' => 'Bouclé White / L-Shape', 'color_name' => 'Warm White', 'color_hex' => '#F5F5DC', 'size' => '3m0 x 1m8', 'price' => 156000000],
                    ['name' => 'Sage Green / L-Shape', 'color_name' => 'Sage Green', 'color_hex' => '#9DC183', 'size' => '3m0 x 1m8', 'price' => 156000000],
                ],
            ],
            [
                'id_slug' => 'chair-lounge-01',
                'name' => 'Ghế Lounge Ombré',
                'sku' => 'GSL-CHAIR-001',
                'category_slug' => 'living-room',
                'collection_slug' => 'velvet-leather-series',
                'price' => 42000000,
                'original_price' => 48000000,
                'summary' => 'Ghế bành dáng vỏ sò, chân đồng thau đánh xước, vải nhập khẩu Ý.',
                'description' => 'Điểm nhấn nghệ thuật hoàn hảo cho phòng khách hoặc góc đọc sách. Thiết kế uốn lượn công thái học nâng đỡ lưng nhẹ nhàng.',
                'material' => 'Vải nhung dệt thủ công Ý, Chân đồng thau nguyên khối',
                'dimensions' => 'W: 88cm x D: 85cm x H: 92cm',
                'warranty' => '24 tháng',
                'care_instructions' => 'Làm sạch bằng bàn chải lông mềm chuyên dụng cho vải nhung.',
                'is_featured' => true,
                'is_new' => false,
                'is_bestseller' => true,
                'rating_avg' => 5.0,
                'rating_count' => 24,
                'images' => ['/images/chair-1.jpeg', '/images/chair-2.jpg'],
                'variants' => [
                    ['name' => 'Ombré Terracotta', 'color_name' => 'Terracotta', 'color_hex' => '#E2725B', 'size' => 'Standard', 'price' => 42000000],
                    ['name' => 'Ombré Midnight Blue', 'color_name' => 'Midnight Blue', 'color_hex' => '#191970', 'size' => 'Standard', 'price' => 42000000],
                ],
            ],
            [
                'id_slug' => 'chair-lounge-02',
                'name' => 'Ghế Đọc Sách Noir',
                'sku' => 'GSL-CHAIR-002',
                'category_slug' => 'living-room',
                'collection_slug' => 'velvet-leather-series',
                'price' => 38500000,
                'original_price' => null,
                'summary' => 'Đường nét tối giản, tựa lưng cao, đệm foam định hình.',
                'description' => 'Phong cách Modern Classic với khung kim loại sơn tĩnh điện mạ đen tuyền sang trọng kết hợp đệm bọc da mịn.',
                'material' => 'Da bò Semi-Aniline, Khung thép carbon',
                'dimensions' => 'W: 80cm x D: 82cm x H: 95cm',
                'warranty' => '24 tháng',
                'care_instructions' => 'Tránh vật nhọn cào xước bề mặt da.',
                'is_featured' => false,
                'is_new' => false,
                'is_bestseller' => false,
                'rating_avg' => 4.7,
                'rating_count' => 8,
                'images' => ['/images/chair-3.jpg'],
            ],
            [
                'id_slug' => 'table-marble-01',
                'name' => 'Bàn Trà Marble Aria',
                'sku' => 'GSL-TABLE-001',
                'category_slug' => 'living-room',
                'collection_slug' => 'handcrafted-marble',
                'price' => 64000000,
                'original_price' => 72000000,
                'summary' => 'Mặt đá cẩm thạch nguyên khối, chân đế hợp kim mạ vàng 24K.',
                'description' => 'Mặt đá cẩm thạch Carrara nhập khẩu từ Ý với các đường vân mây tự nhiên độc bản, được phủ lớp chống thấm chuyên dụng 5 lớp.',
                'material' => 'Đá Marble Calacatta / Carrara Ý, Khung đồng mạ vàng 24K',
                'dimensions' => 'Đường kính: 100cm x Chiều cao: 42cm',
                'warranty' => '36 tháng',
                'care_instructions' => 'Tránh để chất lỏng có tính axit (chanh, rượu vang) bám đọng lâu trên mặt đá.',
                'is_featured' => false,
                'is_new' => true,
                'is_bestseller' => true,
                'rating_avg' => 4.9,
                'rating_count' => 15,
                'images' => ['/images/coffee-table-1.jpg', '/images/coffee-table-3.jpg'],
                'variants' => [
                    ['name' => 'Carrara White / Gold Base', 'color_name' => 'Carrara White', 'color_hex' => '#FFFFFF', 'size' => 'Dia 100cm', 'price' => 64000000],
                    ['name' => 'Nero Marquina Black / Gold Base', 'color_name' => 'Marquina Black', 'color_hex' => '#1A1A1A', 'size' => 'Dia 100cm', 'price' => 68000000],
                ],
            ],
            [
                'id_slug' => 'table-dining-01',
                'name' => 'Bàn Ăn Sovereign',
                'sku' => 'GSL-TABLE-002',
                'category_slug' => 'dining',
                'collection_slug' => 'handcrafted-marble',
                'price' => 189000000,
                'original_price' => 210000000,
                'summary' => 'Bộ bàn ăn 8 ghế, chạm khắc thủ công, hoàn thiện dát vàng.',
                'description' => 'Tuyệt phẩm bàn ăn trung tâm cho những bữa tiệc gia đình đẳng cấp quý tộc. Mặt bàn đá phiến nguyên tấm chịu nhiệt và chịu lực tuyệt đối.',
                'material' => 'Mặt đá Sintered Stone vân mây, Khung gỗ Óc chó Bắc Mỹ dát vàng lá',
                'dimensions' => 'W: 260cm x D: 110cm x H: 76cm',
                'warranty' => '60 tháng chính hãng',
                'care_instructions' => 'Dễ dàng lau chùi bằng nước ấm và khăn mềm.',
                'is_featured' => true,
                'is_new' => false,
                'is_bestseller' => true,
                'rating_avg' => 5.0,
                'rating_count' => 9,
                'images' => ['/images/dining-table-1.jpg', '/images/dining-table-2.webp'],
            ],
            [
                'id_slug' => 'bed-canopy-01',
                'name' => 'Giường Canopy Elysée',
                'sku' => 'GSL-BED-001',
                'category_slug' => 'bedroom',
                'collection_slug' => 'bedroom-sanctuary',
                'price' => 96000000,
                'original_price' => 110000000,
                'summary' => 'Khung giường bốn trụ, phủ vải lanh cao cấp, tay nghề nghệ nhân.',
                'description' => 'Mang trải nghiệm nghỉ dưỡng 6 sao vào chính phòng ngủ của bạn. Khung gỗ sồi nguyên khối kết hợp trụ cột thanh thoát tao nhã.',
                'material' => 'Gỗ Sồi tự nhiên, Vải Lanh Bỉ kháng khuẩn, Giát giường gỗ thông New Zealand',
                'dimensions' => 'Lòng nệm: 180cm x 200cm (Phủ bì: 200cm x 220cm x H: 210cm)',
                'warranty' => '60 tháng',
                'care_instructions' => 'Vệ sinh định kỳ bằng máy hút bụi nệm.',
                'is_featured' => true,
                'is_new' => true,
                'is_bestseller' => false,
                'rating_avg' => 4.9,
                'rating_count' => 14,
                'images' => ['/images/bed-1.jpg', '/images/bed-2.jpg'],
                'variants' => [
                    ['name' => 'King Size (1m8 x 2m0)', 'size' => '1m8 x 2m0', 'price' => 96000000],
                    ['name' => 'Super King Size (2m0 x 2m2)', 'size' => '2m0 x 2m2', 'price' => 112000000],
                ],
            ],
            [
                'id_slug' => 'wardrobe-01',
                'name' => 'Tủ Áo Héritage',
                'sku' => 'GSL-WARD-001',
                'category_slug' => 'bedroom',
                'collection_slug' => 'bedroom-sanctuary',
                'price' => 118000000,
                'original_price' => null,
                'summary' => 'Vân gỗ óc chó tự nhiên, phào chỉ đồng, khoang lưu trữ tối ưu.',
                'description' => 'Hệ tủ áo tích hợp đèn LED cảm biến thông minh, cánh kính màu trà chống tia UV bảo vệ trang phục và túi xách hàng hiệu.',
                'material' => 'Gỗ Óc chó tự nhiên, Kính cường lực màu trà, Phụ kiện Blum giảm chấn',
                'dimensions' => 'W: 240cm x D: 60cm x H: 260cm',
                'warranty' => '36 tháng',
                'care_instructions' => 'Lau cánh kính bằng nước rửa kính chuyên dụng.',
                'is_featured' => false,
                'is_new' => false,
                'is_bestseller' => false,
                'rating_avg' => 4.8,
                'rating_count' => 7,
                'images' => ['/images/wardrobe-1.webp', '/images/wardrobe-2.webp'],
            ],
            [
                'id_slug' => 'mirror-01',
                'name' => 'Gương Trang Trí Cascade',
                'sku' => 'GSL-MIR-001',
                'category_slug' => 'lighting',
                'collection_slug' => 'handcrafted-marble',
                'price' => 24500000,
                'original_price' => null,
                'summary' => 'Khung pha lê xếp lớp thủ công, tạo điểm nhấn ánh sáng.',
                'description' => 'Phôi gương Bỉ AGC tráng bạc 8 lớp sắc nét, chống ố mốc hoàn hảo trong điều kiện khí hậu nhiệt đới.',
                'material' => 'Phôi gương AGC Bỉ, Viền hợp kim mạ Champagne Gold',
                'dimensions' => 'W: 90cm x H: 180cm',
                'warranty' => '24 tháng',
                'care_instructions' => 'Lau bề mặt bằng khăn microfiber mềm.',
                'is_featured' => false,
                'is_new' => false,
                'is_bestseller' => true,
                'rating_avg' => 5.0,
                'rating_count' => 11,
                'images' => ['/images/mirror-1.jpg', '/images/mirror-2.jpg'],
            ],
            [
                'id_slug' => 'lamp-01',
                'name' => 'Đèn Sàn Solstice',
                'sku' => 'GSL-LAMP-001',
                'category_slug' => 'lighting',
                'collection_slug' => 'velvet-leather-series',
                'price' => 18900000,
                'original_price' => 22000000,
                'summary' => 'Thân đồng nguyên khối, chao đèn vải lụa thủ công.',
                'description' => 'Ánh sáng vàng ấm 3000K dịu nhẹ, công tắc điều chỉnh độ sáng Dimmer vô cấp tạo không gian thư giãn sang trọng.',
                'material' => 'Đồng thau nguyên khối đánh bóng thủ công, Chao lụa tơ tằm',
                'dimensions' => 'Đường kính đế: 35cm x Chiều cao: 165cm',
                'warranty' => '24 tháng',
                'care_instructions' => 'Tắt nguồn điện trước khi lau chùi vệ sinh bóng đèn.',
                'is_featured' => false,
                'is_new' => true,
                'is_bestseller' => false,
                'rating_avg' => 4.8,
                'rating_count' => 6,
                'images' => ['/images/lamp-1.jpg', '/images/lamp-2.webp'],
            ],
            [
                'id_slug' => 'desk-01',
                'name' => 'Bàn Làm Việc Executive',
                'sku' => 'GSL-DESK-001',
                'category_slug' => 'bespoke',
                'collection_slug' => 'bespoke-atelier',
                'price' => 74000000,
                'original_price' => 85000000,
                'summary' => 'Mặt bàn da thuộc, khung thép sơn tĩnh điện, thiết kế đặt riêng.',
                'description' => 'Không gian làm việc của những nhà lãnh đạo tầm vóc. Tích hợp cổng sạc không dây và ray quản lý dây điện âm tinh gọn.',
                'material' => 'Gỗ Óc chó tự nhiên kết hợp da bò Saddle Leather',
                'dimensions' => 'W: 180cm x D: 85cm x H: 75cm',
                'warranty' => '36 tháng',
                'care_instructions' => 'Dưỡng da mặt bàn 6 tháng/lần bằng dung dịch chuyên dụng.',
                'is_featured' => true,
                'is_new' => true,
                'is_bestseller' => false,
                'rating_avg' => 5.0,
                'rating_count' => 10,
                'images' => ['/images/desk-1.jpg', '/images/desk-2.jpg'],
            ],
            [
                'id_slug' => 'kitchen-01',
                'name' => 'Tủ Bếp Bespoke Provence',
                'sku' => 'GSL-KIT-001',
                'category_slug' => 'kitchen',
                'collection_slug' => 'bespoke-atelier',
                'price' => 245000000,
                'original_price' => null,
                'summary' => 'Hệ tủ bếp đóng riêng theo không gian, mặt đá tự nhiên, phụ kiện nhập khẩu châu Âu.',
                'description' => 'Thiết kế tủ bếp bán nguyệt kết hợp phong cách Tân cổ điển Pháp. Mỗi khoang chứa đồ được tính toán công thái học hoàn hảo cho người nội trợ.',
                'material' => 'Gỗ Sồi sơn bệt cao cấp Inchem Mỹ, Phụ kiện Hafele & Blum',
                'dimensions' => 'May đo theo mặt bằng thực tế công trình',
                'warranty' => '60 tháng',
                'care_instructions' => 'Bảo hành bảo dưỡng định kỳ miễn phí 2 lần/năm.',
                'is_featured' => false,
                'is_new' => false,
                'is_bestseller' => false,
                'rating_avg' => 5.0,
                'rating_count' => 5,
                'images' => ['/images/kitchen-3.jpg', '/images/kitchen-1.jpg'],
            ],
        ];

        $createdProducts = [];

        foreach ($productsData as $pData) {
            $cat = $categories[$pData['category_slug']] ?? null;
            $col = $collections[$pData['collection_slug']] ?? null;

            $product = Product::create([
                'name' => $pData['name'],
                'slug' => $pData['id_slug'],
                'sku' => $pData['sku'],
                'category_id' => $cat?->id,
                'collection_id' => $col?->id,
                'summary' => $pData['summary'],
                'description' => $pData['description'],
                'price' => $pData['price'],
                'original_price' => $pData['original_price'],
                'material' => $pData['material'],
                'dimensions' => $pData['dimensions'],
                'warranty' => $pData['warranty'],
                'care_instructions' => $pData['care_instructions'],
                'in_stock' => true,
                'stock_quantity' => 15,
                'is_featured' => $pData['is_featured'],
                'is_new' => $pData['is_new'],
                'is_bestseller' => $pData['is_bestseller'],
                'rating_avg' => $pData['rating_avg'],
                'rating_count' => $pData['rating_count'],
                'status' => 'active',
            ]);

            $createdProducts[$pData['id_slug']] = $product;

            // Images
            foreach ($pData['images'] as $idx => $img) {
                ProductImage::create([
                    'product_id' => $product->id,
                    'image_url' => $img,
                    'alt_text' => $product->name,
                    'is_primary' => ($idx === 0),
                    'sort_order' => $idx,
                ]);
            }

            // Variants
            if (!empty($pData['variants'])) {
                foreach ($pData['variants'] as $v) {
                    ProductVariant::create([
                        'product_id' => $product->id,
                        'name' => $v['name'],
                        'sku' => $product->sku . '-' . Str::random(4),
                        'color_name' => $v['color_name'] ?? null,
                        'color_hex' => $v['color_hex'] ?? null,
                        'material' => $v['material'] ?? $product->material,
                        'size' => $v['size'] ?? null,
                        'price' => $v['price'] ?? $product->price,
                        'stock_quantity' => 5,
                        'image_url' => $pData['images'][0] ?? null,
                    ]);
                }
            }

            // Sample Reviews
            Review::create([
                'product_id' => $product->id,
                'user_id' => $customer->id,
                'customer_name' => 'Nguyễn Văn An (Kiến trúc sư)',
                'rating' => 5,
                'title' => 'Chất lượng da và độ hoàn thiện tuyệt vời',
                'comment' => 'Sản phẩm giao đến thực tế còn đẹp hơn trên ảnh 3D. Đường kim mũi chỉ rất đều và sắc sảo, đệm ngồi êm ái vừa phải, rất hài lòng!',
                'is_verified_purchase' => true,
                'is_approved' => true,
            ]);
        }

        // 5. Create Lookbook & Hotspots ("Shop the Room")
        $lookbook = Lookbook::create([
            'title' => 'The Living Sanctuary — Không Gian Phòng Khách Thượng Lưu',
            'slug' => 'the-living-sanctuary',
            'subtitle' => 'Phối cảnh phòng khách đương đại tại Villa Ciputra',
            'description' => 'Sự kết hợp tinh tế giữa bộ Sofa Velvet Aurora màu Cognac, bàn trà đá cẩm thạch Aria và đèn sàn Solstice đồng khối.',
            'space_type' => 'living_room',
            'image_url' => '/images/sofa-1.jpg',
            'is_active' => true,
        ]);

        if (isset($createdProducts['sofa-velvet-01'])) {
            LookbookItem::create([
                'lookbook_id' => $lookbook->id,
                'product_id' => $createdProducts['sofa-velvet-01']->id,
                'x_position' => 22.00,
                'y_position' => 58.00,
                'note' => 'Sofa Velvet Aurora da bò Ý cao cấp',
            ]);
        }

        if (isset($createdProducts['table-marble-01'])) {
            LookbookItem::create([
                'lookbook_id' => $lookbook->id,
                'product_id' => $createdProducts['table-marble-01']->id,
                'x_position' => 48.00,
                'y_position' => 68.00,
                'note' => 'Bàn Trà Marble Aria chân mạ vàng 24K',
            ]);
        }

        if (isset($createdProducts['lamp-01'])) {
            LookbookItem::create([
                'lookbook_id' => $lookbook->id,
                'product_id' => $createdProducts['lamp-01']->id,
                'x_position' => 76.00,
                'y_position' => 34.00,
                'note' => 'Đèn Sàn Solstice đồng nguyên khối',
            ]);
        }

        // 6. Vouchers Khuyến Mãi Mẫu
        Voucher::create([
            'code' => 'GSLUXURY10',
            'name' => 'Ưu đãi Thượng Lưu - Giảm 10%',
            'description' => 'Giảm 10% tối đa 15.000.000₫ cho mọi đơn hàng từ 30.000.000₫',
            'discount_type' => 'percent',
            'discount_value' => 10,
            'min_order_amount' => 30000000,
            'max_discount' => 15000000,
            'usage_limit' => 200,
            'used_count' => 14,
            'start_date' => now()->subDays(5),
            'end_date' => now()->addMonths(2),
            'is_active' => true,
        ]);

        Voucher::create([
            'code' => 'WELCOME500',
            'name' => 'Quà Tặng Chào Mừng Gia Chủ',
            'description' => 'Trừ ngay 500.000₫ vào đơn hàng đầu tiên từ 10.000.000₫',
            'discount_type' => 'fixed',
            'discount_value' => 500000,
            'min_order_amount' => 10000000,
            'usage_limit' => 500,
            'used_count' => 38,
            'start_date' => now()->subDays(10),
            'end_date' => now()->addMonths(3),
            'is_active' => true,
        ]);

        Voucher::create([
            'code' => 'VIPVILLA2M',
            'name' => 'Đặc Quyền Penthouse & Villa',
            'description' => 'Giảm trực tiếp 2.000.000₫ cho đơn hàng nội thất trọn gói từ 80.000.000₫',
            'discount_type' => 'fixed',
            'discount_value' => 2000000,
            'min_order_amount' => 80000000,
            'usage_limit' => 50,
            'used_count' => 7,
            'start_date' => now()->subDays(2),
            'end_date' => now()->addMonths(1),
            'is_active' => true,
        ]);

        // 7. Flash Sale Giờ Vàng
        $flashSale = FlashSale::create([
            'name' => 'Midnight Luxe Deals — Giờ Vàng Nội Thất Thượng Lưu',
            'subtitle' => 'Ưu đãi độc quyền lên tới 35% cho các tuyệt tác phòng khách và phòng ăn',
            'start_time' => now()->subHours(2),
            'end_time' => now()->addHours(14),
            'is_active' => true,
        ]);

        if (isset($createdProducts['sofa-velvet-01'])) {
            FlashSaleProduct::create([
                'flash_sale_id' => $flashSale->id,
                'product_id' => $createdProducts['sofa-velvet-01']->id,
                'flash_price' => 38900000,
                'stock_for_sale' => 5,
                'sold_count' => 3,
            ]);
        }

        if (isset($createdProducts['chair-lounge-01'])) {
            FlashSaleProduct::create([
                'flash_sale_id' => $flashSale->id,
                'product_id' => $createdProducts['chair-lounge-01']->id,
                'flash_price' => 15500000,
                'stock_for_sale' => 8,
                'sold_count' => 6,
            ]);
        }

        if (isset($createdProducts['table-marble-01'])) {
            FlashSaleProduct::create([
                'flash_sale_id' => $flashSale->id,
                'product_id' => $createdProducts['table-marble-01']->id,
                'flash_price' => 22000000,
                'stock_for_sale' => 4,
                'sold_count' => 2,
            ]);
        }

        // 8. Sample FAQs
        if (isset($createdProducts['sofa-velvet-01'])) {
            ProductFaq::create([
                'product_id' => $createdProducts['sofa-velvet-01']->id,
                'user_id' => $customer->id,
                'customer_name' => 'Trần Thu Trang',
                'question' => 'Màu da Cognac của sofa có dễ bám bẩn không và cách vệ sinh như thế nào?',
                'answer' => 'Chào chị Trang, chất liệu da bò Mastrotto Ý đã được xử lý lớp phủ nano kháng nước và chống bám bẩn cao cấp. Hàng tuần chỉ cần lau nhẹ bằng khăn cotton ẩm, và 6 tháng một lần KTS GS Luxury sẽ qua bảo dưỡng thoa kem dưỡng da miễn phí tại nhà cho gia đình mình ạ!',
                'answered_by' => 'KTS. Lê Quang (GS Luxury)',
                'is_approved' => true,
            ]);

            ProductFaq::create([
                'product_id' => $createdProducts['sofa-velvet-01']->id,
                'customer_name' => 'Ngô Đức Thành',
                'question' => 'Nhà tôi ở chung cư tầng 25 thang máy có vừa kích thước sofa 2m4 không?',
                'answer' => 'Chào anh Thành, trước khi giao hàng, đội ngũ kỹ thuật GS Luxury sẽ khảo sát kích thước thang máy và hành lang tòa nhà. Trường hợp thang máy nhỏ, sản phẩm có module tháo lắp chân và đệm lưng chuyên dụng để vận chuyển an toàn 100%.',
                'answered_by' => 'Bộ phận Vận chuyển White-Glove',
                'is_approved' => true,
            ]);
        }
    }
}
