# frozen_string_literal: true

require "pagefind"

module JekyllPagefind
  module Hooks
    CONFIG_KEY = "pagefind"
    OUTPUT_SUBDIR_KEY = "output_subdir"
    DEFAULT_OUTPUT_SUBDIR = "pagefind"

    class << self
      include Jekyll::Filters::URLFilters

      def index(site)
        @context = Liquid::Context.new({}, {}, { :site => site })
        output_subdir = site.config.dig(CONFIG_KEY, OUTPUT_SUBDIR_KEY) || DEFAULT_OUTPUT_SUBDIR
        Pagefind::Index.open(output_path: site.in_dest_dir(output_subdir)) do |index|
          documents(site).each do |document|
            next unless Jekyll::Page::HTML_EXTENSIONS.include?(document.output_ext)
            next unless document.write?

            index.add_html_file(content: document.output, url: relative_url(document.url))
          end
        end
      end

      private

      def documents(site)
        [site.pages, site.collections.values.map(&:docs)].flatten
      end
    end
  end
end

# This is `:post_write`, not `:post_render`, because Jekyll cleans up the
# destination directory between the two and would remove the index.
Jekyll::Hooks.register :site, :post_write do |site|
  JekyllPagefind::Hooks.index(site)
end
