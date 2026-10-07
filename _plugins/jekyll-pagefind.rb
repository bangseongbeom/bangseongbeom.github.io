# frozen_string_literal: true

require "pagefind"

module JekyllPagefind
  module Hooks
    CONFIG_KEY = "pagefind"
    ROOT_SELECTOR_KEY = "root_selector"
    EXCLUDE_SELECTORS_KEY = "exclude_selectors"
    FORCE_LANGUAGE_KEY = "force_language"
    VERBOSE_KEY = "verbose"
    LOGFILE_KEY = "logfile"
    KEEP_INDEX_URL_KEY = "keep_index_url"
    WRITE_PLAYGROUND_KEY = "write_playground"
    INCLUDE_CHARACTERS_KEY = "include_characters"
    OUTPUT_SUBDIR_KEY = "output_subdir"
    DEFAULT_OUTPUT_SUBDIR = "pagefind"

    class << self
      include Jekyll::Filters::URLFilters

      def index(site)
        @context = Liquid::Context.new({}, {}, { :site => site })
        config = site.config[CONFIG_KEY] || {}
        root_selector = config[ROOT_SELECTOR_KEY]
        exclude_selectors = config[EXCLUDE_SELECTORS_KEY]
        force_language = config[FORCE_LANGUAGE_KEY]
        verbose = config[VERBOSE_KEY]
        logfile = config[LOGFILE_KEY]
        keep_index_url = config[KEEP_INDEX_URL_KEY]
        write_playground = config[WRITE_PLAYGROUND_KEY]
        include_characters = config[INCLUDE_CHARACTERS_KEY]
        output_subdir = config[OUTPUT_SUBDIR_KEY] || DEFAULT_OUTPUT_SUBDIR
        Pagefind::Index.open(
          root_selector:,
          exclude_selectors:,
          force_language:,
          verbose:,
          logfile:,
          keep_index_url:,
          write_playground:,
          include_characters:,
          output_path: site.in_dest_dir(output_subdir)
        ) do |index|
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
