import os
from icrawler.builtin import GoogleImageCrawler, BingImageCrawler

def crawl_images(keyword, category, count=100):
    """
    Crawls images from Google and Bing and saves them to the dataset category folder.
    """
    base_dir = os.path.join(os.path.dirname(__file__), 'dataset', category)
    if not os.path.exists(base_dir):
        os.makedirs(base_dir)

    print(f"\n🚀 Starting crawl for '{keyword}' -> dataset/{category}")
    
    # Bing Crawler (Usually more reliable for simple automation)
    bing_crawler = BingImageCrawler(downloader_threads=4, storage={'root_dir': base_dir})
    bing_crawler.crawl(keyword=keyword, max_num=count)
    
    # Note: GoogleImageCrawler often needs a specific API or headers, 
    # Bing is a better first step for local automation.
    print(f"✅ Finished crawling '{keyword}'. Images are in dataset/{category}")

if __name__ == '__main__':
    # Example usage for the user
    # crawl_images('pothole on road', 'infrastructure', count=50)
    # crawl_images('overflowing trash bin urban', 'trash', count=50)
    # crawl_images('flooded urban street', 'flood', count=50)
    
    print("--- Urban AI Crawler ---")
    category = input("Enter category (trash/infrastructure/signs/trees/flood/electric/construction/encroachment): ")
    keyword = input("Enter search keyword (e.g., 'pothole on asphalt road'): ")
    count = int(input("Enter number of images to download: "))
    
    crawl_images(keyword, category, count)
