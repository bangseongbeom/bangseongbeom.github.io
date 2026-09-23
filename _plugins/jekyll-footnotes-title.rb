# frozen_string_literal: true

module Jekyll
  module FootnotesTitle
    # kramdown's output.
    FOOTNOTES_TAG = '<div class="footnotes" role="doc-endnotes">'
    CONFIG_KEY = "footnotes_title"
    DEFAULT_TITLE = "Footnotes"

    class << self
      def add_title(page)
        return unless page.content.include?(FOOTNOTES_TAG)

        title = page.site.config[CONFIG_KEY] || DEFAULT_TITLE
        page.content = page.content.sub(
          FOOTNOTES_TAG,
          %(#{FOOTNOTES_TAG}\n  <h2 id="footnotes">#{title}</h2>)
        )
      end
    end
  end
end

Jekyll::Hooks.register [:pages, :documents], :post_convert do |page|
  Jekyll::FootnotesTitle.add_title(page)
end
