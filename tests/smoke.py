from playwright.sync_api import sync_playwright, expect

BASE='http://127.0.0.1:4173'


def run():
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True)
        page=browser.new_page(viewport={"width":1440,"height":1000})
        page.goto(BASE, wait_until='networkidle')
        page.evaluate("localStorage.clear(); sessionStorage.clear(); location.reload()")
        page.wait_for_load_state('networkidle')

        expect(page.locator('.brand')).to_be_visible()
        expect(page.locator('.omnibar-trigger')).to_be_visible()
        assert page.locator('.signal').count() >= 6
        expect(page.locator('.stream-intro-copy h1')).to_contain_text('Knowledge is not a feed')

        page.locator('[data-open-object="space-stargate"]').first.click()
        expect(page.locator('.space-overlay')).to_be_visible()
        assert '/space/space-stargate/story' in page.url
        expect(page.locator('.space-title')).to_contain_text('Stargate')

        page.locator('[data-space-lens="evidence"]').click()
        expect(page.locator('.evidence-grid')).to_be_visible()
        page.locator('[data-space-lens="claims"]').click()
        expect(page.locator('.claim-list')).to_be_visible()
        page.locator('[data-space-lens="discussion"]').click()
        expect(page.locator('[data-comment-form]')).to_be_visible()
        page.locator('[data-comment-form] textarea').fill('Anonymous context test')
        page.locator('[data-comment-form] button[type="submit"]').click()
        expect(page.locator('.comment-body').filter(has_text='Anonymous context test')).to_be_visible()
        expect(page.locator('.comment-author .anon')).to_be_visible()

        page.locator('[data-close-space]').click()
        expect(page.locator('.space-overlay')).to_have_count(0)

        page.keyboard.press('Control+K')
        expect(page.locator('.command-panel')).to_be_visible()
        page.locator('[data-command-input]').fill('MKULTRA')
        expect(page.locator('[data-command-open="space-mkultra"]')).to_be_visible()
        page.keyboard.press('Escape')

        page.goto(BASE+'/#/login/signup', wait_until='networkidle')
        page.locator('[data-auth-form] input[name="displayName"]').fill('Smoke Researcher')
        page.locator('[data-auth-form] input[name="email"]').fill('smoke@libre.local')
        page.locator('[data-auth-form] input[name="password"]').fill('secret12')
        page.locator('[data-auth-form] button[type="submit"]').click()
        expect(page.locator('[data-account-menu]')).to_be_visible()

        page.locator('[data-route="/studio"]').first.click()
        expect(page.locator('[data-create-draft]')).to_be_visible()
        page.locator('[data-create-draft]').click()
        expect(page.locator('.studio-page')).to_be_visible()
        page.locator('[data-create-studio-object="claim"]').click()
        page.locator('[data-studio-object-form] textarea[name="title"]').fill('A smoke-test claim')
        page.locator('[data-studio-object-form] button[type="submit"]').click()
        expect(page.locator('.canvas-object')).to_be_visible()
        page.locator('[data-add-reader-path]').first.click()
        expect(page.locator('.reader-step')).to_be_visible()
        page.locator('[data-publish-draft]').click()
        expect(page.locator('.space-overlay')).to_be_visible()
        expect(page.locator('.space-title')).to_contain_text('Untitled Knowledge Space')

        page.locator('[data-close-space]').click()
        page.goto(BASE+'/#/algorithm', wait_until='networkidle')
        slider=page.locator('[data-algorithm-key="discovery"]')
        expect(slider).to_be_visible()
        slider.fill('82')
        assert page.evaluate("window.__LIBRE__.repository.getState().algorithm.discovery") == 82

        mobile=browser.new_page(viewport={"width":390,"height":844})
        mobile.goto(BASE, wait_until='networkidle')
        expect(mobile.locator('.mobile-nav')).to_be_visible()
        assert mobile.evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth")
        mobile.locator('[data-open-object="space-stargate"]').first.click()
        expect(mobile.locator('.space-overlay')).to_be_visible()
        assert mobile.evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth")

        browser.close()


if __name__ == '__main__':
    run()
    print('smoke: PASS')
